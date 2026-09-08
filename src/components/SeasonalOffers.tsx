import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Tag, Check, Copy, ArrowRight, Flame, EyeOff } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

// High-quality AI generated banners for festive seasons & special sales
import festiveBannerImg from '../assets/images/festive_maha_sale_1788545754852.jpg';
import harvestBannerImg from '../assets/images/harvest_fresh_sale_1788545772060.jpg';
import superSaverBannerImg from '../assets/images/super_saver_sale_1788545795226.jpg';
import freshProduceBannerImg from '../assets/images/fresh_produce_sale_1788546888919.jpg';

interface SeasonalOffersProps {
  lang: Language;
  onSelectOfferCategory: (categoryName: string) => void;
  onHide?: () => void;
  onHideAll?: () => void;
}

interface OfferItem {
  id: string;
  image: string;
  badgeEn: string;
  badgeHi: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  highlightEn: string;
  highlightHi: string;
  couponCode: string;
  targetCategory: string;
  bgGradient: string;
  badgeColor: string;
}

const seasonalOffers: OfferItem[] = [
  {
    id: 'festive-dhamaka',
    image: festiveBannerImg,
    badgeEn: 'Diwali & Navratri Special',
    badgeHi: 'दिवाली व नवरात्रि स्पेशल',
    titleEn: 'Festive Maha Mahotsav',
    titleHi: 'त्यौहार महा महोत्सव',
    subtitleEn: 'Up to 50% OFF on Pure Desi Ghee Sweets, Premium Dry Fruits & Puja Thalis',
    subtitleHi: 'देसी घी मिठाई, प्रीमियम मेवे और पूजन सामग्री पर 50% तक की भारी छूट',
    highlightEn: 'FLAT 50% OFF',
    highlightHi: 'सीधी 50% छूट',
    couponCode: 'FESTIVE50',
    targetCategory: 'Sweets',
    bgGradient: 'from-amber-950/90 via-black/70 to-transparent',
    badgeColor: 'bg-amber-400 text-amber-950'
  },
  {
    id: 'mango-fresh-produce',
    image: freshProduceBannerImg,
    badgeEn: 'Fresh Orchard & Mango Festival',
    badgeHi: 'ताज़ा आम एवं फल महोत्सव',
    titleEn: 'Summer Fresh Fruit Fiesta',
    titleHi: 'समर फ्रेश फ्रूट मेला',
    subtitleEn: 'Juicy Sweet Mangoes, Watermelons, Papayas & Crisp Veggies with Extra Discounts',
    subtitleHi: 'रसदार मीठे आम, तरबूज, पपीता और ताज़ी हरी सब्जियाँ विशेष छूट के साथ',
    highlightEn: 'UP TO 40% OFF',
    highlightHi: '40% तक की छूट',
    couponCode: 'MANGO40',
    targetCategory: 'Fruits',
    bgGradient: 'from-orange-950/90 via-black/70 to-transparent',
    badgeColor: 'bg-orange-400 text-orange-950'
  },
  {
    id: 'farm-harvest',
    image: harvestBannerImg,
    badgeEn: 'Farm Fresh Harvest',
    badgeHi: 'खेतों से सीधा ताज़ा',
    titleEn: 'Seasonal Harvest Bumper Mela',
    titleHi: 'मौसमी फसल बंपर मेला',
    subtitleEn: 'Crisp Seasonal Apples, Farm Green Veggies & Herbs at Direct Mandi Rates',
    subtitleHi: 'ताज़े पहाड़ी सेब, हरी पत्तेदार सब्ज़ियाँ व फल सीधे मंडी के थोक भाव में',
    highlightEn: 'UP TO 35% SAVINGS',
    highlightHi: '35% तक की बचत',
    couponCode: 'HARVEST20',
    targetCategory: 'Vegetables',
    bgGradient: 'from-emerald-950/90 via-black/70 to-transparent',
    badgeColor: 'bg-emerald-400 text-emerald-950'
  },
  {
    id: 'super-saver',
    image: superSaverBannerImg,
    badgeEn: 'Weekend Blockbuster',
    badgeHi: 'वीकेंड ब्लॉकबस्टर सेल',
    titleEn: 'Maha Bachat Ration Sale',
    titleHi: 'महाबचत राशन सेल',
    subtitleEn: 'Instant ₹100 Cashback on Basmati Rice, Mustard Cooking Oils & Dairy Essentials',
    subtitleHi: 'बासमती चावल, सरसों तेल, दालें और ताज़ा डेयरी उत्पादों पर ₹100 की सीधी बचत',
    highlightEn: 'EXTRA ₹100 OFF',
    highlightHi: 'अतिरिक्त ₹100 छूट',
    couponCode: 'BACHAT100',
    targetCategory: 'Drinks',
    bgGradient: 'from-slate-950/90 via-black/70 to-transparent',
    badgeColor: 'bg-yellow-400 text-slate-950'
  }
];

export function SeasonalOffers({
  lang,
  onSelectOfferCategory,
  onHide,
  onHideAll
}: SeasonalOffersProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  // Auto rotate banner every 5.5 seconds unless paused by user hover/focus
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % seasonalOffers.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Clean up copy timeout
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % seasonalOffers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + seasonalOffers.length) % seasonalOffers.length);
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code);
      }
    } catch {
      // Fallback
    }
    setCopiedCode(code);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const currentOffer = seasonalOffers[currentIndex];

  const handleActionClick = (targetCategory: string) => {
    onSelectOfferCategory(targetCategory);
    // Smooth scroll down to product section
    const productGrid = document.getElementById('products-section');
    if (productGrid) {
      productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="seasonal-offers-container"
      className="space-y-3"
      aria-label="Seasonal Offers and Festive Sales"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t('seasonalOffers')}</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                {t('festiveTag')}
              </span>
            </h2>
          </div>
        </div>

        {/* Navigation Arrows & Hide Banner */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onHide && (
            <button
              id="hide-seasonal-banner-btn"
              type="button"
              onClick={onHide}
              title={t('hideBanner')}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs text-slate-600 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">{t('hideBanner')}</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              id="offer-prev-btn"
              type="button"
              onClick={handlePrev}
              aria-label="Previous Seasonal Offer"
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="offer-next-btn"
              type="button"
              onClick={handleNext}
              aria-label="Next Seasonal Offer"
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Banner Hero */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-900 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Mobile Hide Button Overlay */}
        {onHide && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            title={t('hideBanner')}
            className="absolute top-3.5 right-3.5 z-30 flex sm:hidden items-center gap-1 bg-black/45 hover:bg-black/75 backdrop-blur-md text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 transition-all cursor-pointer active:scale-95"
          >
            <EyeOff className="w-3 h-3 text-white/80" />
            <span className="uppercase tracking-wider">{t('hideBanner')}</span>
          </button>
        )}
        <div className="relative min-h-[190px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-end p-5 sm:p-7 overflow-hidden">
          {/* Background Images with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentOffer.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 z-0"
            >
              <img
                src={currentOffer.image}
                alt={lang === 'hi' ? currentOffer.titleHi : currentOffer.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center brightness-60 contrast-110"
              />
              {/* Radial and Linear Gradient Overlays */}
              <div className={`absolute inset-0 bg-gradient-to-r ${currentOffer.bgGradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 sm:left-6 z-20 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${currentOffer.badgeColor}`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'hi' ? currentOffer.badgeHi : currentOffer.badgeEn}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
              <Flame className="w-3 h-3 fill-white" />
              <span>{lang === 'hi' ? currentOffer.highlightHi : currentOffer.highlightEn}</span>
            </span>
          </div>

          {/* Banner Content */}
          <div className="relative z-10 max-w-xl space-y-2 mt-8">
            <motion.h3
              key={`title-${currentOffer.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md"
            >
              {lang === 'hi' ? currentOffer.titleHi : currentOffer.titleEn}
            </motion.h3>

            <motion.p
              key={`sub-${currentOffer.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 drop-shadow-sm leading-relaxed"
            >
              {lang === 'hi' ? currentOffer.subtitleHi : currentOffer.subtitleEn}
            </motion.p>

            {/* Actions & Coupon Code */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Shop Category Button */}
              <button
                id="offer-action-btn"
                type="button"
                onClick={() => handleActionClick(currentOffer.targetCategory)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>{t('shopNow')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Coupon Badge (Click to Copy) */}
              <button
                id="coupon-copy-btn"
                type="button"
                onClick={(e) => handleCopyCode(currentOffer.couponCode, e)}
                title={lang === 'hi' ? 'कूपन कोड कॉपी करें' : 'Click to copy coupon code'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Tag className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-[11px] font-mono tracking-widest text-yellow-300 font-black">
                  {currentOffer.couponCode}
                </span>
                <span className="text-[10px] text-slate-200 border-l border-white/20 pl-1.5 flex items-center gap-1">
                  {copiedCode === currentOffer.couponCode ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-300 font-bold">{t('codeCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-300" />
                      <span>{t('copyCode')}</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Progress Indicators at bottom right */}
          <div className="absolute bottom-3 right-4 sm:right-6 z-20 flex items-center gap-1.5">
            {seasonalOffers.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to offer ${idx + 1}`}
                className={`transition-all duration-300 h-1.5 rounded-full cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-yellow-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnail Switcher Bar for Quick Direct Selection */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
          {seasonalOffers.map((offer, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={offer.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`p-2.5 sm:px-4 text-left transition-all border-r last:border-r-0 border-white/10 flex items-center gap-2.5 cursor-pointer ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/20">
                  <img
                    src={offer.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-400 truncate">
                    {lang === 'hi' ? offer.badgeHi : offer.badgeEn}
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    {lang === 'hi' ? offer.titleHi : offer.titleEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
