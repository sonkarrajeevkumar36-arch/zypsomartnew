import React from 'react';
import { Category, Language } from '../types';
import { getTranslation } from '../translations';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  lang: Language;
  onSelectCategory: (cat: string) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  lang,
  onSelectCategory
}: CategoryListProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 px-1 py-1.5 -mx-1 touch-pan-x overscroll-x-contain">
      {/* All Option */}
      <button
        type="button"
        onClick={() => onSelectCategory('All')}
        className={`flex flex-col items-center gap-1 min-w-[62px] transition-all cursor-pointer ${
          selectedCategory === 'All' ? 'scale-105' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs border transition-all ${
            selectedCategory === 'All'
              ? 'bg-green-600 border-green-600 text-white shadow-green-200'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          🛍️
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-tight ${
            selectedCategory === 'All' ? 'text-green-700 font-extrabold' : 'text-slate-500'
          }`}
        >
          {t('categories.all')}
        </span>
      </button>

      {/* Dynamic Categories */}
      {categories.map((cat) => {
        const catName = cat?.name || '';
        const isSelected = (selectedCategory || '').toLowerCase().trim() === catName.toLowerCase().trim();
        return (
          <button
            key={cat.id || Math.random().toString()}
            type="button"
            onClick={() => onSelectCategory(catName)}
            className={`flex flex-col items-center gap-1 min-w-[62px] transition-all cursor-pointer ${
              isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs border transition-all ${
                isSelected
                  ? 'bg-green-600 border-green-600 text-white shadow-green-200'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {cat.icon || '📦'}
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[68px] ${
                isSelected ? 'text-green-700 font-extrabold' : 'text-slate-500'
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
