import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tag, Plus, Package } from 'lucide-react';
import { CartItem, Language, Product, ResolvedProductOffer } from '../types';
import { getTranslation } from '../translations';
import { formatRupees } from '../utils/offerUtils';

interface ProductOffersSectionProps {
  offers: ResolvedProductOffer[];
  cart: CartItem[];
  lang: Language;
  onSelectOffer: (offer: ResolvedProductOffer) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onUpdateQty: (productId: string, delta: number) => void;
}

export function ProductOffersSection({
  offers,
  cart,
  lang,
  onSelectOffer,
  onAddToCart,
  onUpdateQty
}: ProductOffersSectionProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!offers || offers.length === 0) return null;

  return (
    <section id="live-offers-section" className="space-y-3" aria-label={t('hotDeals')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
            {t('hotDeals')}
          </h2>
          <span className="bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-black px-2 py-0.5 rounded-full">
            {offers.length}
          </span>
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 px-1 py-1 -mx-1 touch-pan-x overscroll-x-contain items-stretch">
        {offers.map((offer) => {
          const quantityInCart = cart.find((item) => item.id === offer.productId)?.qty || 0;
          const imgKey = `${offer.offerId}::${offer.imageUrl}`;
          const hasValidImg = Boolean(offer.imageUrl) && !failedImages[imgKey];
          const unitLabel =
            lang === 'hi' && offer.product.unit
              ? t(`units.${(offer.product.unit || '').toLowerCase()}`) || offer.product.unit
              : offer.product.unit || 'kg';
          const bannerLabel = offer.badgeText || offer.title || t('specialOffer');
          const offerProduct: Product = {
            ...offer.product,
            price: offer.discountedPrice
          };

          return (
            <motion.div
              key={offer.offerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              role="button"
              tabIndex={0}
              onClick={() => onSelectOffer(offer)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectOffer(offer);
                }
              }}
              className="w-[162px] sm:w-[186px] shrink-0 bg-white rounded-2xl p-3 shadow-xs border border-rose-100 hover:border-green-300 hover:shadow-md transition-all flex flex-col justify-between relative cursor-pointer group select-none focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              {/* Image + Offer Badge & Banner */}
              <div className="bg-slate-50 rounded-xl h-28 mb-2 flex items-center justify-center p-2 overflow-hidden relative">
                {hasValidImg ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={offer.imageUrl}
                    alt={offer.productName}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [imgKey]: true
                      }))
                    }
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}

                {/* Discount Percentage Badge */}
                <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs tracking-tight">
                  {t('offLabel', { val: offer.discountPercentage })}
                </span>

                {/* Offer Banner Strip */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[9px] font-extrabold px-2 py-0.5 truncate text-center">
                  {bannerLabel}
                </div>
              </div>

              {/* Product Name & Unit */}
              <div className="flex flex-col mb-2">
                <h3
                  className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors"
                  title={offer.productName}
                >
                  {offer.productName}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {unitLabel} • {t('saveAmount', { val: formatRupees(offer.savingsAmount) })}
                </span>
              </div>

              {/* Pricing & Cart Action */}
              <div className="flex items-center justify-between gap-1.5 mt-auto pt-2 border-t border-slate-50">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-green-700 leading-none">
                      ₹{formatRupees(offer.discountedPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold line-through leading-none">
                      ₹{formatRupees(offer.originalPrice)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">
                    / {unitLabel}
                  </span>
                </div>

                {quantityInCart > 0 ? (
                  <div
                    className="flex items-center bg-green-50 border border-green-200 rounded-xl p-0.5 shadow-xs shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(offer.productId, -1);
                      }}
                      className="w-6 h-6 flex items-center justify-center font-bold text-green-700 hover:bg-green-100 rounded-lg transition-colors cursor-pointer text-xs"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-black text-green-900">
                      {quantityInCart}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(offer.productId, 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center font-bold text-green-700 hover:bg-green-100 rounded-lg transition-colors cursor-pointer text-xs"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(offerProduct, e);
                    }}
                    className="bg-white border border-green-600 text-green-700 text-[10px] font-black px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs hover:bg-green-600 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-0.5 shrink-0"
                  >
                    <span>{t('add')}</span>
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
