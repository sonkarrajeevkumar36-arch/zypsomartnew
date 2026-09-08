import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, EyeOff } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface BannerProps {
  lang: Language;
  onHide?: () => void;
}

export function Banner({ lang, onHide }: BannerProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <div className="relative overflow-hidden group">
      <div className="relative rounded-2xl p-5 min-w-full h-44 flex flex-col justify-center overflow-hidden shadow-lg transition-all duration-500 hover:scale-[1.01]">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center brightness-50 contrast-125 transition-transform duration-1000 group-hover:scale-105"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop")'
          }}
        />
        {/* Gradients */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badge */}
        <div className="absolute top-3.5 left-4 z-20 flex items-center gap-1.5 bg-yellow-400 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Fresh Daily</span>
        </div>

        {/* Hide Banner Button */}
        {onHide && (
          <button
            id="hide-promo-banner-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            title={t('hideBanner')}
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/40 hover:bg-black/75 backdrop-blur-md text-white/90 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <EyeOff className="w-3 h-3 text-white/80" />
            <span className="text-[10px] uppercase tracking-wider">{t('hideBanner')}</span>
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 space-y-1.5">
          <motion.h3
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-black leading-tight text-white drop-shadow-md"
          >
            {t('brandHindiPromise')}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-col gap-0.5"
          >
            <p className="text-xs font-black uppercase tracking-wider text-green-400 drop-shadow-sm">
              LOWEST PRICE GUARANTEED
            </p>
            <p className="text-[9px] font-bold text-white/80 tracking-tight">
              {t('avlIn')}
            </p>
          </motion.div>
        </div>

        {/* Accent Glows */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-green-500/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-yellow-500/10 rounded-full blur-[60px] pointer-events-none" />
      </div>
    </div>
  );
}
