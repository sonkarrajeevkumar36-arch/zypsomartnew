import { Offer, Product, ResolvedProductOffer } from '../types';

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatRupees(value: number): string {
  const rounded = roundCurrency(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function parseFirestoreTimeMs(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val < 1e12 ? val * 1000 : val;
  }
  if (typeof val?.toMillis === 'function') {
    const ms = val.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof val?.seconds === 'number') {
    return val.seconds * 1000;
  }
  if (val instanceof Date) {
    const ms = val.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const ms = Date.parse(trimmed);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function parseOptionalBoolean(val: unknown): boolean | null {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const norm = val.trim().toLowerCase();
    if (norm === 'true' || norm === '1' || norm === 'yes') return true;
    if (norm === 'false' || norm === '0' || norm === 'no') return false;
  }
  if (typeof val === 'number') {
    if (val === 1) return true;
    if (val === 0) return false;
  }
  return null;
}

export function isOfferActiveAndValid(offer: Offer, nowMs: number = Date.now()): boolean {
  if (!offer) return false;

  const isActiveFlag = parseOptionalBoolean(offer.isActive);
  if (isActiveFlag === false) return false;

  const activeFlag = parseOptionalBoolean(offer.active);
  if (activeFlag === false) return false;

  const enabledFlag = parseOptionalBoolean(offer.enabled);
  if (enabledFlag === false) return false;

  if (typeof offer.status === 'string' && offer.status.trim()) {
    const statusNorm = offer.status.trim().toLowerCase();
    const disabledStatuses = [
      'inactive',
      'disabled',
      'expired',
      'paused',
      'draft',
      'deleted',
      'archived',
      'cancelled',
      'canceled',
      'off',
      'ended'
    ];
    if (disabledStatuses.includes(statusNorm)) {
      return false;
    }
    const explicitlyAllowed = ['active', 'enabled', 'live', 'published', 'running'];
    if (!explicitlyAllowed.includes(statusNorm)) {
      return false;
    }
  }

  const startMs =
    parseFirestoreTimeMs(offer.startDate) ??
    parseFirestoreTimeMs(offer.validFrom) ??
    parseFirestoreTimeMs(offer.startsAt);
  if (startMs !== null && nowMs < startMs) {
    return false;
  }

  const endMs =
    parseFirestoreTimeMs(offer.endDate) ??
    parseFirestoreTimeMs(offer.expiryDate) ??
    parseFirestoreTimeMs(offer.validUntil) ??
    parseFirestoreTimeMs(offer.expiresAt);
  if (endMs !== null && nowMs > endMs) {
    return false;
  }

  return true;
}

export function resolveOffers(
  rawOffers: Offer[],
  products: Product[],
  nowMs: number = Date.now()
): {
  activeOffers: ResolvedProductOffer[];
  offerByProductId: Record<string, ResolvedProductOffer>;
} {
  if (!Array.isArray(rawOffers) || rawOffers.length === 0 || !Array.isArray(products) || products.length === 0) {
    return { activeOffers: [], offerByProductId: {} };
  }

  const productById = new Map<string, Product>();
  const productByNormName = new Map<string, Product>();

  for (const prod of products) {
    if (!prod?.id) continue;
    productById.set(String(prod.id).trim(), prod);
    const normName = (prod.name || '').trim().toLowerCase();
    if (normName && !productByNormName.has(normName)) {
      productByNormName.set(normName, prod);
    }
  }

  const offerByProductId: Record<string, ResolvedProductOffer> = {};

  for (const offer of rawOffers) {
    if (!isOfferActiveAndValid(offer, nowMs)) continue;

    const rawProdId = String(offer.productId || offer.product_id || offer.itemId || '').trim();
    let matchedProduct: Product | undefined = rawProdId ? productById.get(rawProdId) : undefined;

    if (!matchedProduct) {
      const candidateName = String(offer.productName || offer.name || '').trim().toLowerCase();
      if (candidateName) {
        matchedProduct = productByNormName.get(candidateName);
      }
    }

    // Only show offers tied to an existing product that hasn't been marked Unavailable
    if (!matchedProduct || matchedProduct.status === 'Unavailable') continue;

    const offerOrigCandidate = Number(
      offer.originalPrice ?? offer.regularPrice ?? offer.mrp ?? offer.oldPrice ?? 0
    );
    const productBasePrice = Number(matchedProduct.price) || 0;
    const originalPrice = roundCurrency(
      offerOrigCandidate > 0 ? offerOrigCandidate : productBasePrice
    );

    if (originalPrice <= 0) continue;

    const explicitDiscountedCandidate = Number(
      offer.discountedPrice ??
        offer.offerPrice ??
        offer.salePrice ??
        offer.finalPrice ??
        offer.newPrice ??
        NaN
    );

    const discountType = String(offer.discountType || '').trim().toLowerCase();
    const rawPctCandidate = Number(
      offer.discountPercentage ??
        offer.discountPercent ??
        offer.percentage ??
        offer.offPercent ??
        (discountType !== 'flat' && discountType !== 'fixed' ? offer.discount : NaN)
    );
    const rawFlatCandidate = Number(
      offer.flatDiscount ??
        offer.discountAmount ??
        (discountType === 'flat' || discountType === 'fixed'
          ? offer.discountValue ?? offer.discount
          : NaN)
    );

    let discountedPrice = NaN;

    if (
      Number.isFinite(explicitDiscountedCandidate) &&
      explicitDiscountedCandidate > 0 &&
      explicitDiscountedCandidate < originalPrice
    ) {
      discountedPrice = roundCurrency(explicitDiscountedCandidate);
    } else if (
      Number.isFinite(rawFlatCandidate) &&
      rawFlatCandidate > 0 &&
      rawFlatCandidate < originalPrice
    ) {
      discountedPrice = roundCurrency(originalPrice - rawFlatCandidate);
    } else if (
      Number.isFinite(rawPctCandidate) &&
      rawPctCandidate > 0 &&
      rawPctCandidate < 100
    ) {
      discountedPrice = roundCurrency(originalPrice * (1 - rawPctCandidate / 100));
    }

    if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= originalPrice) {
      continue;
    }

    const savingsAmount = roundCurrency(originalPrice - discountedPrice);
    const discountPercentage = Math.round((savingsAmount / originalPrice) * 100);

    if (discountPercentage < 1 || discountPercentage > 99) continue;

    const endMs =
      parseFirestoreTimeMs(offer.endDate) ??
      parseFirestoreTimeMs(offer.expiryDate) ??
      parseFirestoreTimeMs(offer.validUntil) ??
      parseFirestoreTimeMs(offer.expiresAt);

    const resolvedImage =
      String(
        offer.productImage ||
          offer.productImageUrl ||
          offer.imageUrl ||
          offer.image ||
          offer.bannerImage ||
          matchedProduct.imageUrl ||
          ''
      ).trim() || matchedProduct.imageUrl;

    const resolvedName =
      String(matchedProduct.name || offer.productName || offer.name || 'Item').trim();

    const resolvedTitle = String(offer.title || '').trim();
    const resolvedBadge = String(offer.badgeText || '').trim();

    const resolved: ResolvedProductOffer = {
      offerId: offer.id,
      productId: matchedProduct.id,
      product: matchedProduct,
      title: resolvedTitle,
      badgeText: resolvedBadge,
      imageUrl: resolvedImage,
      productName: resolvedName,
      originalPrice,
      discountedPrice,
      discountPercentage,
      savingsAmount,
      validUntilMs: endMs
    };

    const existing = offerByProductId[matchedProduct.id];
    if (!existing || resolved.discountPercentage > existing.discountPercentage) {
      offerByProductId[matchedProduct.id] = resolved;
    }
  }

  // Only list in-stock products in the featured Special Offers showcase
  const activeOffers = Object.values(offerByProductId)
    .filter((o) => o.product.status === 'Available')
    .sort((a, b) => b.discountPercentage - a.discountPercentage);

  return { activeOffers, offerByProductId };
}
