import React from 'react';
import { Search, Phone, LogOut, User, Download } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Language } from '../types';
import { getTranslation } from '../translations';
import defaultAppLogo from '../assets/logo.png';

interface HeaderProps {
  user: FirebaseUser | null;
  lang: Language;
  searchQuery: string;
  supportNumber: string;
  appLogoUrl: string;
  isSyncing?: boolean;
  isAppInstalled?: boolean;
  canInstall?: boolean;
  onInstallClick?: () => void;
  onSearchChange: (q: string) => void;
  onRefresh?: () => void;
  onLanguageToggle: () => void;
  onAuthClick: () => void;
}

export function Header({
  user,
  lang,
  searchQuery,
  supportNumber,
  appLogoUrl,
  isAppInstalled,
  canInstall,
  onInstallClick,
  onSearchChange,
  onLanguageToggle,
  onAuthClick
}: HeaderProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-5 pb-3 px-3 sm:px-6 border-b border-slate-100 space-y-2.5 sm:space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        {/* Logo & Branding - Pure customer brand representation */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-md shadow-green-100 border border-slate-100 bg-white p-1 shrink-0 flex items-center justify-center"
          >
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

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate">
                {t('appName')}
              </h1>
              <span className="bg-green-100 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                Instant
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
              <p className="text-[9px] sm:text-[10px] font-black text-green-700 uppercase tracking-wider truncate">
                {t('deliveryTime')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* In-App Install Prompt Button (Hidden if already installed) */}
          {!isAppInstalled && canInstall && onInstallClick && (
            <button
              id="header-install-app-btn"
              type="button"
              onClick={onInstallClick}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg text-[10px] sm:text-xs font-black shadow-xs transition-all cursor-pointer"
              title={t('installApp')}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase tracking-tight">{t('installApp')}</span>
            </button>
          )}

          {/* Language Switch */}
          <button
            type="button"
            onClick={onLanguageToggle}
            className="px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] sm:text-xs font-black text-slate-700 border border-slate-200 uppercase tracking-tight transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>

          {/* Support Phone */}
          <a
            href={`tel:${supportNumber || '8090315246'}`}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
            title="Call Support"
          >
            <Phone className="w-4 h-4" />
          </a>

          {/* Auth Profile / Logout */}
          <button
            type="button"
            onClick={onAuthClick}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-xs font-bold cursor-pointer transition-transform active:scale-90 ${
              user ? 'bg-slate-900 text-white hover:bg-red-600' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={user ? 'Click to Logout' : 'Click to Login'}
          >
            {user ? <LogOut className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 sm:py-2.5 pl-9 pr-4 text-[16px] sm:text-xs font-medium focus:outline-none placeholder:text-slate-400 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-none"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
}

