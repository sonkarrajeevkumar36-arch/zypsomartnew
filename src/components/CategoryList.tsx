import React, { useState } from 'react';
import { LayoutGrid, ImageIcon } from 'lucide-react';
import { Category, Language } from '../types';
import { getTranslation } from '../translations';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  lang: Language;
  onSelectCategory: (cat: string) => void;
}

function isImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/')
  );
}

function getCategoryImageUrl(cat: Category): string | null {
  const candidates = [
    cat.imageUrl,
    cat.image,
    cat.imgUrl,
    cat.photoUrl,
    cat.thumbnail,
    cat.iconUrl,
    cat.icon,
  ];

  for (const candidate of candidates) {
    if (isImageUrl(candidate)) {
      return candidate.trim();
    }
  }
  return null;
}

export function CategoryList({
  categories,
  selectedCategory,
  lang,
  onSelectCategory
}: CategoryListProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (cacheKey: string) => {
    setFailedImages((prev) => {
      if (prev[cacheKey]) return prev;
      return { ...prev, [cacheKey]: true };
    });
  };

  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 md:gap-5 px-1 py-2 -mx-1 touch-pan-x overscroll-x-contain items-start">
      {/* All Option */}
      <button
        type="button"
        onClick={() => onSelectCategory('All')}
        aria-pressed={selectedCategory === 'All'}
        className={`group flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[76px] md:w-[82px] py-1 rounded-2xl transition-all cursor-pointer ${
          selectedCategory === 'All' ? 'scale-[1.03]' : 'opacity-85 hover:opacity-100'
        }`}
      >
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-2xl flex items-center justify-center shadow-xs border transition-all ${
            selectedCategory === 'All'
              ? 'bg-theme-primary border-theme-primary text-white theme-shadow ring-2 ring-[var(--theme-primary)]/30'
              : 'bg-white border-slate-200/90 text-slate-600 group-hover:border-slate-300 group-hover:shadow-sm'
          }`}
        >
          <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.1} />
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold leading-tight text-center line-clamp-2 w-full transition-colors ${
            selectedCategory === 'All' ? 'text-theme-primary font-extrabold' : 'text-slate-600 group-hover:text-slate-900'
          }`}
        >
          {t('categories.all')}
        </span>
      </button>

      {/* Dynamic Categories */}
      {categories.map((cat, index) => {
        const catName = (cat?.name || '').trim();
        const catKey = cat.id || `${catName}-${index}`;
        const isSelected = (selectedCategory || '').toLowerCase().trim() === catName.toLowerCase();
        const imageUrl = getCategoryImageUrl(cat);
        const imageCacheKey = imageUrl ? `${catKey}::${imageUrl}` : '';
        const showImage = Boolean(imageUrl && !failedImages[imageCacheKey]);

        return (
          <button
            key={catKey}
            type="button"
            onClick={() => onSelectCategory(catName)}
            aria-pressed={isSelected}
            className={`group flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[76px] md:w-[82px] py-1 rounded-2xl transition-all cursor-pointer ${
              isSelected ? 'scale-[1.03]' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-2xl overflow-hidden flex items-center justify-center shadow-xs border transition-all relative ${
                isSelected
                  ? 'border-theme-primary bg-theme-light theme-shadow ring-2 ring-[var(--theme-primary)]/30'
                  : 'bg-white border-slate-200/90 group-hover:border-slate-300 group-hover:shadow-sm'
              }`}
            >
              {showImage ? (
                <img
                  src={imageUrl!}
                  alt={catName || 'Category'}
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(imageCacheKey)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    isSelected ? 'bg-theme-light text-theme-primary' : 'bg-slate-100/90 text-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
                </div>
              )}
            </div>
            <span
              className={`text-[11px] sm:text-xs font-bold leading-tight text-center line-clamp-2 w-full transition-colors ${
                isSelected ? 'text-theme-primary font-extrabold' : 'text-slate-700 group-hover:text-slate-900'
              }`}
            >
              {catName || t('categories.all')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
