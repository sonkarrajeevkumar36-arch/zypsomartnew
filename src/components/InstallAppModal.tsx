import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Zap, BellRing, Smartphone } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';
import defaultAppLogo from '../assets/logo.png';

interface InstallAppModalProps {
  isOpen: boolean;
  onInstall: () => void;
  onClose: () => void;
  lang: Language;
  appLogoUrl?: string;
}

export function InstallAppModal({
  isOpen,
  onInstall,
  onClose,
  lang,
  appLogoUrl
}: InstallAppModalProps) {
  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <AnimatePresence>
      <div
        id="pwa-install-modal-backdrop"
        className="fixed inset-0 z-[290] bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          id="pwa-install-modal"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="pt-5 px-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Smartphone className="w-3 h-3" />
                PWA Application
              </span>
            </div>
            <button
              id="pwa-install-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center space-y-5">
            {/* Logo Badge */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-white p-2.5 shadow-xl shadow-green-600/10 border-2 border-green-100 flex items-center justify-center">
                <img
                  src={appLogoUrl || defaultAppLogo}
                  alt="Zypsomart Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultAppLogo;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1.5 shadow-md">
                <Download className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t('installAppTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
                {t('installAppDesc')}
              </p>
            </div>

            {/* Quick Benefits */}
            <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-left space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>{lang === 'hi' ? '20-30 मिनट में सुपरफास्ट डिलीवरी' : 'Superfast 20-30 min grocery delivery'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <span>{lang === 'hi' ? 'एक टैप में होम स्क्रीन से खरीदारी' : 'One-tap access from your home screen'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <span>{lang === 'hi' ? 'लाइव डिलीवरी और डिस्काउंट अपडेट्स' : 'Real-time order tracking & exclusive discounts'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              <button
                id="pwa-install-confirm-btn"
                type="button"
                onClick={onInstall}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-green-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('installNow')}</span>
              </button>

              <button
                id="pwa-install-dismiss-btn"
                type="button"
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                {t('maybeLater')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
