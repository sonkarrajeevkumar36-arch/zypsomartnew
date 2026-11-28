export type OrderStatus =
  | 'placed'
  | 'pending'
  | 'preparing'
  | 'out for delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_pending'
  | 'returned'
  | 'return_approved'
  | 'return_rejected';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  unit: string;
  imageUrl: string;
  category: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  normalizedCategory?: string;
  status: 'Available' | 'Out of Stock' | 'Unavailable';
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  normalizedName?: string;
  icon?: string;
  imageUrl?: string;
  image?: string;
  imgUrl?: string;
  photoUrl?: string;
  thumbnail?: string;
  iconUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus | string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  estimatedDelivery?: string;
  createdAt?: any;
  returnReason?: string;
  returnNotes?: string;
  returnRequestedAt?: any;
  returnApprovedAt?: any;
  returnRejectedAt?: any;
  returnedAt?: any;
  cancellationReason?: string;
}

export interface ModalAlert {
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface FlyingItem {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
}

export type Language = 'en' | 'hi';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface Offer {
  id: string;
  productId?: string;
  product_id?: string;
  itemId?: string;
  productName?: string;
  name?: string;
  title?: string;
  description?: string;
  badgeText?: string;
  imageUrl?: string;
  productImage?: string;
  productImageUrl?: string;
  image?: string;
  bannerImage?: string;
  originalPrice?: number;
  regularPrice?: number;
  mrp?: number;
  oldPrice?: number;
  price?: number;
  discountedPrice?: number;
  offerPrice?: number;
  salePrice?: number;
  finalPrice?: number;
  newPrice?: number;
  discountPercentage?: number;
  discountPercent?: number;
  discount?: number;
  percentage?: number;
  offPercent?: number;
  discountType?: string;
  discountValue?: number;
  flatDiscount?: number;
  discountAmount?: number;
  isActive?: boolean | string;
  active?: boolean | string;
  enabled?: boolean | string;
  status?: string;
  startDate?: any;
  validFrom?: any;
  startsAt?: any;
  endDate?: any;
  expiryDate?: any;
  validUntil?: any;
  expiresAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface ResolvedProductOffer {
  offerId: string;
  productId: string;
  product: Product;
  title: string;
  badgeText: string;
  imageUrl: string;
  productName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  validUntilMs: number | null;
}
