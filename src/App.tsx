import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Package, Home as HomeIcon, RotateCcw, Clock, Lock, Sparkles, EyeOff, Eye, Download } from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { auth, db, getFriendlyErrorMessage } from './firebase';
import { Product, Category, Order, CartItem, ModalAlert, FlyingItem, Language, BeforeInstallPromptEvent } from './types';
import { getTranslation } from './translations';
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { CategoryList } from './components/CategoryList';
import { SeasonalOffers } from './components/SeasonalOffers';
import { ProductCard } from './components/ProductCard';
import { CartModal } from './components/CartModal';
import { OrdersModal } from './components/OrdersModal';
import { ReturnOrderModal } from './components/ReturnOrderModal';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { AlertModal } from './components/AlertModal';
import { InstallAppModal } from './components/InstallAppModal';

// Initial starter mock products for instant zero-latency experience if Firestore is initializing
const defaultInitialProducts: Product[] = [
  { id: 'def_1', name: 'Fresh Farm Eggs (12 pcs)', price: 84, unit: 'dozen', category: 'Eggs', imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&auto=format&fit=crop&q=80', status: 'Available' },
  { id: 'def_2', name: 'Pure Cow Milk (1 Litre)', price: 62, unit: 'litre', category: 'Drinks', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80', status: 'Available' },
  { id: 'def_3', name: 'Organic Red Tomatoes', price: 35, unit: 'kg', category: 'Vegetables', imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80', status: 'Available' },
  { id: 'def_4', name: 'Fresh Cavendish Bananas', price: 48, unit: 'dozen', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop&q=80', status: 'Available' },
  { id: 'def_5', name: 'Alphonso Mangoes Premium', price: 180, unit: 'kg', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&auto=format&fit=crop&q=80', status: 'Available' },
  { id: 'def_6', name: 'Gulab Jamun (500g)', price: 140, unit: 'pack', category: 'Sweets', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop&q=80', status: 'Available' }
];

const defaultInitialCategories: Category[] = [
  { id: 'cat_1', name: 'Fruits', icon: '🍎', normalizedName: 'fruits' },
  { id: 'cat_2', name: 'Vegetables', icon: '🥦', normalizedName: 'vegetables' },
  { id: 'cat_3', name: 'Drinks', icon: '🥛', normalizedName: 'drinks' },
  { id: 'cat_4', name: 'Eggs', icon: '🥚', normalizedName: 'eggs' },
  { id: 'cat_5', name: 'Sweets', icon: '🍬', normalizedName: 'sweets' },
  { id: 'cat_6', name: 'Fast Food', icon: '🍔', normalizedName: 'fast food' },
  { id: 'cat_7', name: 'Stationary', icon: '✏️', normalizedName: 'stationary' }
];

// User-scoped LocalStorage helpers: cart_<uid>, customer_name_<uid>, etc.
const getUserStorageKey = (uid: string | null | undefined, prefix: string) => {
  return uid ? `${prefix}_${uid}` : `${prefix}_guest`;
};

const loadUserCart = (uid: string | null | undefined): CartItem[] => {
  try {
    const key = getUserStorageKey(uid, 'cart');
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[loadUserCart error]:', err);
  }
  return [];
};

const loadUserData = (uid: string | null | undefined) => {
  try {
    return {
      name: localStorage.getItem(getUserStorageKey(uid, 'customer_name')) || '',
      phone: localStorage.getItem(getUserStorageKey(uid, 'customer_phone')) || '',
      address: localStorage.getItem(getUserStorageKey(uid, 'customer_address')) || '',
    };
  } catch {
    return { name: '', phone: '', address: '' };
  }
};

export default function App() {
  // Auth state & User Session Tracking
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const activeUidRef = useRef<string | null>(auth.currentUser ? auth.currentUser.uid : null);

  const initialUid = auth.currentUser ? auth.currentUser.uid : null;
  const initialUserData = loadUserData(initialUid);

  // Products & Categories with localStorage Cache
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('zypsum_products_cache');
      return cached ? JSON.parse(cached) : defaultInitialProducts;
    } catch {
      return defaultInitialProducts;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('zypsum_categories_cache');
      return cached ? JSON.parse(cached) : defaultInitialCategories;
    } catch {
      return defaultInitialCategories;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Customer Cart & Info isolated per UID
  const [cart, setCart] = useState<CartItem[]>(() => loadUserCart(initialUid));
  const [customerName, setCustomerName] = useState<string>(() => initialUserData.name || auth.currentUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => initialUserData.phone || auth.currentUser?.phoneNumber || '');
  const [customerAddress, setCustomerAddress] = useState<string>(() => initialUserData.address || '');

  // Language
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('zypsum_lang') as Language) || 'en');

  // Modals & Navigation
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);

  // Dedicated Return Order state
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);

  // Modal alert
  const [activeAlert, setActiveAlert] = useState<ModalAlert | null>(null);

  // Shop Control State
  const [isShopClosed, setIsShopClosed] = useState<boolean>(false);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(25);
  const [supportNumber, setSupportNumber] = useState<string>('8090315246');
  const [appLogoUrl, setAppLogoUrl] = useState<string>('');

  // Orders lists
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [allAdminOrders, setAllAdminOrders] = useState<Order[]>([]);

  // Admin PIN input
  const [adminPin, setAdminPin] = useState<string>('');

  // Flying items for cart animation
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const cartIconRef = useRef<HTMLDivElement | null>(null);
  const previousTotalRef = useRef<number>(0);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Native PWA beforeinstallprompt management
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // User Banner Visibility preference (persisted in localStorage)
  const [isSeasonalBannerHidden, setIsSeasonalBannerHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zypsomart_hide_seasonal') === 'true';
    } catch {
      return false;
    }
  });
  const [isPromoBannerHidden, setIsPromoBannerHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zypsomart_hide_promo') === 'true';
    } catch {
      return false;
    }
  });

  const handleHideSeasonalBanner = () => {
    setIsSeasonalBannerHidden(true);
    try {
      localStorage.setItem('zypsomart_hide_seasonal', 'true');
    } catch (e) {
      console.warn('Failed to save seasonal banner preference', e);
    }
  };

  const handleHidePromoBanner = () => {
    setIsPromoBannerHidden(true);
    try {
      localStorage.setItem('zypsomart_hide_promo', 'true');
    } catch (e) {
      console.warn('Failed to save promo banner preference', e);
    }
  };

  const handleHideAllBanners = () => {
    setIsSeasonalBannerHidden(true);
    setIsPromoBannerHidden(true);
    try {
      localStorage.setItem('zypsomart_hide_seasonal', 'true');
      localStorage.setItem('zypsomart_hide_promo', 'true');
    } catch (e) {
      console.warn('Failed to save banner preferences', e);
    }
  };

  const handleShowAllBanners = () => {
    setIsSeasonalBannerHidden(false);
    setIsPromoBannerHidden(false);
    try {
      localStorage.removeItem('zypsomart_hide_seasonal');
      localStorage.removeItem('zypsomart_hide_promo');
    } catch (e) {
      console.warn('Failed to clear banner preferences', e);
    }
  };

  // Translation helper
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  // Native beforeinstallprompt detection & lifecycle
  useEffect(() => {
    // 1. Detect if the app is already installed / running in standalone mode
    const checkIsInstalled = () => {
      try {
        const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
        const isAndroidReferrer = document.referrer?.includes('android-app://') || false;
        return isStandaloneDisplay || isIOSStandalone || isAndroidReferrer;
      } catch {
        return false;
      }
    };

    if (checkIsInstalled()) {
      setIsAppInstalled(true);
      return;
    }

    // 2. Check early captured prompt from main.tsx
    if ((window as any).__pwaDeferredPrompt) {
      const earlyPrompt = (window as any).__pwaDeferredPrompt as BeforeInstallPromptEvent;
      setDeferredPrompt(earlyPrompt);
      try {
        const isDismissed = sessionStorage.getItem('zypsomart_pwa_dismissed') === 'true';
        if (!isDismissed) {
          setShowInstallModal(true);
        }
      } catch {
        setShowInstallModal(true);
      }
    }

    // 3. Listen to browser native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      (window as any).__pwaDeferredPrompt = installEvent;
      setDeferredPrompt(installEvent);

      // Show install modal unless user explicitly dismissed it in this session
      try {
        const isDismissed = sessionStorage.getItem('zypsomart_pwa_dismissed') === 'true';
        if (!isDismissed) {
          setShowInstallModal(true);
        }
      } catch {
        setShowInstallModal(true);
      }
    };

    // 4. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Secure URL-based admin launcher for store manager/owner (?admin=true or #admin)
  useEffect(() => {
    const checkAdminTrigger = () => {
      try {
        const isParam = window.location.search.includes('admin=true');
        const isHash = window.location.hash === '#admin';
        if (isParam || isHash) {
          setIsAdminAuthOpen(true);
        }
      } catch {
        // ignore in environments where location is restricted
      }
    };
    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);
    return () => window.removeEventListener('hashchange', checkAdminTrigger);
  }, []);

  // Cleanup legacy global keys once on mount
  useEffect(() => {
    try {
      localStorage.removeItem('zypsum_cart_cache');
      localStorage.removeItem('zypsum_customerName');
      localStorage.removeItem('zypsum_customerPhone');
      localStorage.removeItem('zypsum_customerAddress');
    } catch {}
  }, []);

  // Persist user-scoped cart (cart_<uid>)
  useEffect(() => {
    const uid = currentUser ? currentUser.uid : null;
    if (uid === activeUidRef.current) {
      try {
        const key = getUserStorageKey(uid, 'cart');
        localStorage.setItem(key, JSON.stringify(cart));
      } catch (e) {
        console.warn('Failed to persist user cart', e);
      }
    }
  }, [cart, currentUser]);

  // Persist user-scoped customer details
  useEffect(() => {
    const uid = currentUser ? currentUser.uid : null;
    if (uid === activeUidRef.current) {
      try {
        localStorage.setItem(getUserStorageKey(uid, 'customer_name'), customerName);
      } catch {}
    }
  }, [customerName, currentUser]);

  useEffect(() => {
    const uid = currentUser ? currentUser.uid : null;
    if (uid === activeUidRef.current) {
      try {
        localStorage.setItem(getUserStorageKey(uid, 'customer_phone'), customerPhone);
      } catch {}
    }
  }, [customerPhone, currentUser]);

  useEffect(() => {
    const uid = currentUser ? currentUser.uid : null;
    if (uid === activeUidRef.current) {
      try {
        localStorage.setItem(getUserStorageKey(uid, 'customer_address'), customerAddress);
      } catch {}
    }
  }, [customerAddress, currentUser]);

  useEffect(() => {
    localStorage.setItem('zypsum_lang', lang);
  }, [lang]);

  // Auth observer with clean session isolation and race condition prevention
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const newUid = user ? user.uid : null;
      const previousUid = activeUidRef.current;

      // Only perform session state switch if authenticated UID changed
      if (previousUid !== newUid) {
        // Update activeUidRef synchronously before React state updates to lock out stale effects
        activeUidRef.current = newUid;

        // Load current user's own data from storage
        const nextCart = loadUserCart(newUid);
        const nextData = loadUserData(newUid);

        // Apply new user's state atomically
        setCurrentUser(user);
        setCart(nextCart);
        setCustomerName(nextData.name || user?.displayName || '');
        setCustomerPhone(nextData.phone || user?.phoneNumber || '');
        setCustomerAddress(nextData.address || '');

        // Immediately clear any active user orders / modal states from previous user
        setUserOrders([]);
        setOrderToReturn(null);
        setIsReturnModalOpen(false);

        if (!user) {
          setIsOrdersOpen(false);
        }
      } else {
        // Keep user reference updated without resetting state
        setCurrentUser(user);
      }
    });

    return () => unsub();
  }, []);

  // Sync user orders in real time
  useEffect(() => {
    if (!currentUser) {
      setUserOrders([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(30)
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: Order[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as any)
          }));
          setUserOrders(list);
        },
        (err) => {
          console.warn('[Orders Snapshot Warning]:', err);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('[Orders Query Init Error]:', err);
    }
  }, [currentUser]);

  // Sound chime helper for admin order stream
  const playOrderNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc2.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn('[Audio Alert Notice]:', err);
    }
  };

  // Sync admin live orders when dashboard is opened
  const isFirstAdminSnapshot = useRef<boolean>(true);
  useEffect(() => {
    if (!isAdminDashboardOpen) {
      setAllAdminOrders([]);
      isFirstAdminSnapshot.current = true;
      return;
    }

    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(60));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: Order[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as any)
          }));

          if (isFirstAdminSnapshot.current) {
            setAllAdminOrders(list);
            isFirstAdminSnapshot.current = false;
          } else {
            setAllAdminOrders((prev) => {
              list.forEach((newOrder) => {
                const isNew = !prev.some((p) => p.id === newOrder.id);
                const status = (newOrder.status || '').toLowerCase();
                if (isNew && (status === 'placed' || status === 'pending' || status === 'return_requested' || status === 'return_pending')) {
                  playOrderNotificationSound();
                }
              });
              return list;
            });
          }
        },
        (err) => {
          console.warn('[Admin Orders Error]:', err);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('[Admin Stream Setup Error]:', err);
    }
  }, [isAdminDashboardOpen]);

  // Sync Shop Control Status & Settings
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'shopControl', 'status'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setDeliveryCharge(data.deliveryCharge ?? 25);
            setSupportNumber(data.supportNumber || '8090315246');
            setIsShopClosed(data.isClosed ?? false);
            setAppLogoUrl(data.appLogoUrl || '');
          }
        },
        (err) => {
          console.warn('[Shop Control Listener]:', err);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('[Shop Control Init Error]:', err);
    }
  }, []);

  // Load Inventory from Firestore
  const syncInventory = async (showFeedback = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      if (!catSnap.empty) {
        const loadedCats: Category[] = catSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data?.name || 'Category',
            icon: data?.icon || '📦',
            normalizedName: data?.normalizedName || (data?.name || '').toLowerCase().trim(),
            ...data
          };
        });
        setCategories(loadedCats);
        localStorage.setItem('zypsum_categories_cache', JSON.stringify(loadedCats));
      }

      const prodSnap = await getDocs(collection(db, 'products'));
      if (!prodSnap.empty) {
        const loadedProds: Product[] = prodSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data?.name || 'Product',
            price: Number(data?.price) || 0,
            unit: data?.unit || 'kg',
            imageUrl: data?.imageUrl || '',
            category: data?.category || 'General',
            normalizedCategory: data?.normalizedCategory || (data?.category || '').toLowerCase().trim(),
            status: data?.status || 'Available',
            ...data
          };
        });
        setProducts(loadedProds);
        localStorage.setItem('zypsum_products_cache', JSON.stringify(loadedProds));
      }

      if (showFeedback) {
        setActiveAlert({
          type: 'success',
          title: lang === 'hi' ? 'ताज़ा स्टॉक अपडेट हुआ!' : 'Inventory Updated!',
          message:
            lang === 'hi'
              ? 'सभी किराना आइटम और श्रेणियां सर्वर से सिंक हो गई हैं।'
              : 'The latest grocery stock and categories have synced successfully.'
        });
      }
    } catch (err) {
      console.warn('[Sync Error]:', err);
      if (showFeedback) {
        setActiveAlert({
          type: 'error',
          title: lang === 'hi' ? 'सिंक विफल' : 'Sync Error',
          message: getFriendlyErrorMessage(err)
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncInventory(false);
    const interval = setInterval(() => {
      syncInventory(false);
    }, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  // Free delivery threshold tracking
  const rawItemTotal = cart.reduce((sum, i) => sum + (Number(i?.price) || 0) * (Number(i?.qty) || 0), 0);
  useEffect(() => {
    if (rawItemTotal > 100 && previousTotalRef.current <= 100 && cart.length > 0) {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
      setShowCelebration(true);
      // Visible for exactly 1 second (1000ms), then automatically hidden
      celebrationTimerRef.current = setTimeout(() => {
        setShowCelebration(false);
        celebrationTimerRef.current = null;
      }, 1000);
    }
    previousTotalRef.current = rawItemTotal;
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    };
  }, [rawItemTotal, cart.length]);

  // Cart operations
  const handleAddToCart = (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (product.status !== 'Available') return;

    if (e && cartIconRef.current) {
      const btnRect = e.currentTarget.getBoundingClientRect();
      const flyingId = Math.random().toString(36).substring(2, 9);
      const newFlying: FlyingItem = {
        id: flyingId,
        imageUrl: product.imageUrl,
        x: btnRect.left,
        y: btnRect.top
      };
      setFlyingItems((prev) => [...prev, newFlying]);
      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== flyingId));
      }, 800);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setActiveAlert({
        type: 'error',
        title: lang === 'hi' ? 'विवरण अधूरा है' : 'Missing Details',
        message:
          lang === 'hi'
            ? 'कृपया डिलीवरी के लिए अपना नाम, फ़ोन नंबर और पूरा पता दर्ज करें।'
            : 'Please provide your full name, phone number, and delivery address before ordering.'
      });
      return;
    }

    if (cart.length === 0) return;

    const itemTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const appliedDelivery = itemTotal > 100 ? 0 : deliveryCharge;
    const finalTotal = itemTotal + appliedDelivery;

    try {
      const minMinutes = 18;
      const maxMinutes = 28;

      await addDoc(collection(db, 'orders'), {
        userId: currentUser.uid,
        items: cart,
        total: finalTotal,
        status: 'placed',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        estimatedDelivery: `${minMinutes}-${maxMinutes} mins`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setCart([]);
      setIsCartOpen(false);

      setActiveAlert({
        type: 'success',
        title: t('orderPlaced'),
        message: t('orderPlacedMsg', { time: `${minMinutes}–${maxMinutes}` }),
        onConfirm: () => {
          setActiveAlert(null);
          setIsOrdersOpen(true);
        }
      });
    } catch (err: any) {
      console.error('[Place Order Error]:', err);
      setActiveAlert({
        type: 'error',
        title: lang === 'hi' ? 'ऑर्डर नहीं हो सका' : 'Order Failed',
        message: getFriendlyErrorMessage(err)
      });
    }
  };

  // Cancel Order
  const handleCancelOrder = (orderId: string) => {
    setActiveAlert({
      type: 'confirm',
      title: lang === 'hi' ? 'ऑर्डर रद्द करें?' : 'Cancel Order',
      message:
        lang === 'hi'
          ? 'क्या आप वाकई इस ऑर्डर को रद्द करना चाहते हैं?'
          : 'Are you sure you want to cancel this placed order?',
      confirmText: lang === 'hi' ? 'हाँ, रद्द करें' : 'Yes, Cancel',
      cancelText: lang === 'hi' ? 'नहीं' : 'Keep Order',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'cancelled',
            updatedAt: serverTimestamp()
          });
          setActiveAlert({
            type: 'success',
            title: lang === 'hi' ? 'ऑर्डर रद्द हो गया' : 'Order Cancelled',
            message:
              lang === 'hi'
                ? 'आपका ऑर्डर सफलतापूर्वक रद्द कर दिया गया है।'
                : 'Your order has been cancelled successfully.'
          });
        } catch (err: any) {
          console.error('[Cancel Order Error]:', err);
          setActiveAlert({
            type: 'error',
            title: lang === 'hi' ? 'रद्द नहीं हो सका' : 'Cancellation Failed',
            message: getFriendlyErrorMessage(err)
          });
        }
      }
    });
  };

  // Open Return Order Modal
  const handleOpenReturnModal = (order: Order) => {
    if (!currentUser) {
      setIsOrdersOpen(false);
      setIsAuthOpen(true);
      setActiveAlert({
        type: 'info',
        title: lang === 'hi' ? 'लॉगिन आवश्यक' : 'Sign In Required',
        message: lang === 'hi' ? 'कृपया वापसी का अनुरोध करने के लिए पहले लॉगिन करें।' : 'Please sign in to request an order return.'
      });
      return;
    }

    if (!order?.id || !order?.userId) {
      setActiveAlert({
        type: 'error',
        title: lang === 'hi' ? 'अमान्य ऑर्डर' : 'Invalid Order',
        message: lang === 'hi' ? 'ऑर्डर की जानकारी उपलब्ध नहीं है।' : 'Order information is incomplete or invalid.'
      });
      return;
    }

    if (order.userId !== currentUser.uid) {
      setActiveAlert({
        type: 'error',
        title: lang === 'hi' ? 'अनधिकृत कार्रवाई' : 'Unauthorized Action',
        message: lang === 'hi' ? 'आप केवल अपने स्वयं के ऑर्डर वापस कर सकते हैं।' : 'You can only request returns for your own orders.'
      });
      return;
    }

    setOrderToReturn(order);
    setIsReturnModalOpen(true);
  };

  // Handle successful return submission
  const handleReturnSuccess = (orderId: string) => {
    setActiveAlert({
      type: 'success',
      title: t('returnSuccessTitle'),
      message: t('returnSuccessMsg')
    });
  };

  // Reorder previous items
  const handleReorder = (order: Order) => {
    setCart((prev) => {
      const nextCart = [...prev];
      order.items?.forEach((pastItem) => {
        const idx = nextCart.findIndex((c) => c.id === pastItem.id);
        if (idx >= 0) {
          nextCart[idx] = { ...nextCart[idx], qty: nextCart[idx].qty + pastItem.qty };
        } else {
          nextCart.push({ ...pastItem });
        }
      });
      return nextCart;
    });
    setIsOrdersOpen(false);
    setIsCartOpen(true);
    setActiveAlert({
      type: 'success',
      title: lang === 'hi' ? 'कार्ट में जोड़ा गया' : 'Added to Cart',
      message:
        lang === 'hi'
          ? 'पिछले ऑर्डर के सभी आइटम आपके कार्ट में जोड़ दिए गए हैं।'
          : 'All items from your previous order have been added to your cart.'
    });
  };

  // Auth Logout Confirmation
  const handleLogoutClick = () => {
    setActiveAlert({
      type: 'confirm',
      title: t('logoutTitle'),
      message: t('logoutMsg'),
      confirmText: t('yesLogout'),
      cancelText: t('cancelBtn'),
      onConfirm: async () => {
        try {
          await signOut(auth);
          setActiveAlert(null);
        } catch (err: any) {
          setActiveAlert({
            type: 'error',
            title: 'Logout Error',
            message: getFriendlyErrorMessage(err)
          });
        }
      }
    });
  };

  // Admin PIN Verification
  const handleVerifyAdminPin = () => {
    if (adminPin.trim() === '0000') {
      setIsAdminAuthOpen(false);
      setIsAdminDashboardOpen(true);
      setAdminPin('');
    } else {
      setActiveAlert({
        type: 'error',
        title: lang === 'hi' ? 'गलत पिन' : 'Incorrect PIN',
        message:
          lang === 'hi'
            ? 'कृपया सही 4-अंकीय व्यवस्थापक पिन दर्ज करें।'
            : 'Please enter the valid 4-digit administrative PIN code.'
      });
      setAdminPin('');
    }
  };

  // Native PWA Install Handlers
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setIsAppInstalled(true);
        setShowInstallModal(false);
      }
    } catch (err) {
      console.warn('[PWA Install Prompt Error]:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallModal(false);
    try {
      sessionStorage.setItem('zypsomart_pwa_dismissed', 'true');
    } catch {
      // ignore in storage-restricted environments
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const searchTarget = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = (p?.name || '').toLowerCase().includes(searchTarget);
    const normSelected = (selectedCategory || 'All').trim().toLowerCase();
    const prodCategory = (p?.normalizedCategory || (p?.category || '')).trim().toLowerCase();
    const matchesCategory = normSelected === 'all' || prodCategory === normSelected;
    return matchesSearch && matchesCategory;
  });

  const cartTotalCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative w-full max-w-7xl mx-auto shadow-sm font-sans">
      {/* Main Header */}
      <Header
        user={currentUser}
        lang={lang}
        searchQuery={searchQuery}
        supportNumber={supportNumber}
        appLogoUrl={appLogoUrl}
        isSyncing={isSyncing}
        isAppInstalled={isAppInstalled}
        canInstall={!isAppInstalled && !!deferredPrompt}
        onInstallClick={() => setShowInstallModal(true)}
        onSearchChange={setSearchQuery}
        onLanguageToggle={() => setLang(lang === 'en' ? 'hi' : 'en')}
        onAuthClick={currentUser ? handleLogoutClick : () => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]">
        {/* Categories Bar */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          lang={lang}
          onSelectCategory={setSelectedCategory}
        />

        {/* Banner Restore Notification Bar when any or all banners are hidden */}
        {!searchQuery && (isSeasonalBannerHidden || isPromoBannerHidden) && (
          <div
            id="hidden-banners-bar"
            className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-2xl text-xs text-slate-600 shadow-2xs transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700">
                {isSeasonalBannerHidden && isPromoBannerHidden
                  ? t('bannersHidden')
                  : isSeasonalBannerHidden
                  ? t('seasonalHidden')
                  : t('promoHidden')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(!isSeasonalBannerHidden || !isPromoBannerHidden) && (
                <button
                  type="button"
                  onClick={handleHideAllBanners}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold hover:underline cursor-pointer"
                >
                  {t('hideAllBanners')}
                </button>
              )}
              <button
                id="restore-banners-btn"
                type="button"
                onClick={handleShowAllBanners}
                className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('showBanners')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Seasonal Offers below category list */}
        {!searchQuery && !isSeasonalBannerHidden && (
          <SeasonalOffers
            lang={lang}
            onSelectOfferCategory={(catName) => {
              setSelectedCategory(catName);
            }}
            onHide={handleHideSeasonalBanner}
            onHideAll={handleHideAllBanners}
          />
        )}

        {/* Promo Banner if not searching */}
        {!searchQuery && !isPromoBannerHidden && (
          <Banner
            lang={lang}
            onHide={handleHidePromoBanner}
          />
        )}

        {/* Syncing notification bar */}
        {isSyncing && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 flex items-center justify-center gap-2 animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-black text-green-800 uppercase tracking-wider">
              {lang === 'hi' ? 'ताज़ा स्टॉक अपडेट हो रहा है...' : 'Syncing fresh inventory...'}
            </span>
          </div>
        )}

        {/* Product Grid */}
        <div id="products-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
              {selectedCategory === 'All' ? (lang === 'hi' ? 'सभी ताज़ा सामान' : 'All Fresh Items') : selectedCategory}{' '}
              <span className="text-slate-400 font-semibold text-xs">({filteredProducts.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {filteredProducts.slice(0, displayLimit).map((product) => {
              const inCart = cart.find((i) => i.id === product.id)?.qty || 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  quantityInCart={inCart}
                  onAddToCart={handleAddToCart}
                  onUpdateQty={handleUpdateCartQty}
                />
              );
            })}
          </div>

          {/* Load more button if items exceed display limit */}
          {displayLimit < filteredProducts.length && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 24)}
                className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-black px-6 py-2.5 rounded-full shadow-xs border border-slate-200 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{lang === 'hi' ? 'और आइटम देखें' : 'LOAD MORE ITEMS'}</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {filteredProducts.length - displayLimit} left
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 sm:px-12 md:px-24 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40">
        {/* Home */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('All');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 text-green-700 font-extrabold cursor-pointer"
        >
          <HomeIcon className="w-5 h-5 fill-current" />
          <span className="text-[10px] uppercase tracking-tight">{t('home')}</span>
        </button>

        {/* Orders */}
        <button
          type="button"
          onClick={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
            } else {
              setIsOrdersOpen(true);
            }
          }}
          className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">{t('orders')}</span>
        </button>

        {/* Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer relative"
        >
          <div className="relative" ref={cartIconRef}>
            <ShoppingCart className="w-5 h-5" />
            {cartTotalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-green-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-xs">
                {cartTotalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight">{t('cart')}</span>
        </button>

        {/* PWA Install Button (Shown on mobile when installable and not yet installed) */}
        {!isAppInstalled && !!deferredPrompt && (
          <button
            id="bottom-nav-install-btn"
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="flex flex-col items-center gap-0.5 text-green-700 hover:text-green-800 transition-colors cursor-pointer"
            title={t('installApp')}
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{t('installApp')}</span>
          </button>
        )}
      </nav>

      {/* Floating Add to Cart Animation */}
      <div className="fixed inset-0 pointer-events-none z-[250]">
        <AnimatePresence>
          {flyingItems.map((fItem) => {
            const targetRect = cartIconRef.current?.getBoundingClientRect();
            if (!targetRect) return null;
            return (
              <motion.img
                key={fItem.id}
                src={fItem.imageUrl}
                initial={{ x: fItem.x, y: fItem.y, scale: 0.8, opacity: 1, borderRadius: '16px' }}
                animate={{ x: targetRect.left, y: targetRect.top, scale: 0.2, opacity: 0.4, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="fixed w-12 h-12 object-contain bg-white shadow-xl border border-slate-200 p-1.5"
                style={{ left: 0, top: 0 }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Free Delivery Celebration Popup */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[280] flex items-center justify-center pointer-events-none p-6"
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, -6, 6, 0], y: [0, -30, 0] }}
              className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] shadow-2xl border border-green-200 flex flex-col items-center gap-3 text-center"
            >
              <span className="text-5xl animate-bounce">🎉</span>
              <div>
                <h3 className="text-xl font-black text-green-700 uppercase">
                  {t('freeUnlockedTitle')}
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {t('unlockedOn')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        cart={cart}
        lang={lang}
        deliveryCharge={deliveryCharge}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onCustomerAddressChange={setCustomerAddress}
        onUpdateQty={handleUpdateCartQty}
        onClose={() => setIsCartOpen(false)}
        onPlaceOrder={handlePlaceOrder}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        orders={userOrders}
        lang={lang}
        onClose={() => setIsOrdersOpen(false)}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={handleOpenReturnModal}
        onReorder={handleReorder}
      />

      {/* Dedicated Return Order Modal solving user's issue */}
      <ReturnOrderModal
        isOpen={isReturnModalOpen}
        order={orderToReturn}
        lang={lang}
        onClose={() => {
          setIsReturnModalOpen(false);
          setOrderToReturn(null);
        }}
        onSuccess={handleReturnSuccess}
        onError={(errMsg) => {
          setActiveAlert({
            type: 'error',
            title: lang === 'hi' ? 'वापसी अनुरोध में त्रुटि' : 'Return Request Error',
            message: errMsg
          });
        }}
      />

      {/* Native PWA Install Prompt Modal */}
      <InstallAppModal
        isOpen={showInstallModal && !isAppInstalled && !!deferredPrompt}
        onInstall={handleInstallApp}
        onClose={handleDismissInstall}
        lang={lang}
        appLogoUrl={appLogoUrl}
      />

      <AdminModal
        isOpen={isAdminDashboardOpen}
        orders={allAdminOrders}
        products={products}
        categories={categories}
        isShopClosed={isShopClosed}
        supportNumber={supportNumber}
        appLogoUrl={appLogoUrl}
        lang={lang}
        onClose={() => setIsAdminDashboardOpen(false)}
        onRefreshProducts={() => syncInventory(true)}
        onShowSuccess={(title, msg) => setActiveAlert({ type: 'success', title, message: msg })}
        onShowError={(title, msg) => setActiveAlert({ type: 'error', title, message: msg })}
      />

      {/* Admin PIN Dialog */}
      <AnimatePresence>
        {isAdminAuthOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[195] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsAdminAuthOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[28px] p-6 shadow-2xl text-center relative text-slate-900 border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black mb-1 text-slate-900">Admin Dashboard</h3>
              <p className="text-xs text-slate-500 mb-4">Enter 4-digit PIN (Default: 0000)</p>

              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyAdminPin()}
                className="w-full text-center text-2xl tracking-[0.8em] font-black px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
              />

              <button
                type="button"
                onClick={handleVerifyAdminPin}
                className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Verify PIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthOpen}
        lang={lang}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(email, isLogin) => {
          setActiveAlert({
            type: 'success',
            title: isLogin ? 'Welcome Back!' : 'Account Created!',
            message: `Signed in as ${email}`
          });
        }}
        onError={(errMsg) => {
          setActiveAlert({
            type: 'error',
            title: 'Authentication Error',
            message: errMsg
          });
        }}
        onResetSent={() => {
          setActiveAlert({
            type: 'success',
            title: 'Password Reset Sent',
            message: t('resetEmailSent')
          });
        }}
      />

      <AlertModal alert={activeAlert} onClose={() => setActiveAlert(null)} />

      {/* Shop Closed Banner / Overlay */}
      {isShopClosed && (
        <div className="fixed inset-0 z-[170] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-slate-900">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">{t('shopClosed')}</h2>
          <p className="text-slate-600 text-xs leading-relaxed max-w-xs mb-6">
            {t('shopClosedSub')}
          </p>
          <a
            href={`tel:${supportNumber || '8090315246'}`}
            className="px-6 py-3 bg-green-600 text-white text-xs font-black rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all"
          >
            {t('needHelp')}
          </a>
        </div>
      )}
    </div>
  );
}
