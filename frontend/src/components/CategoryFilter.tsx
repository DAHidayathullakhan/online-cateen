import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none py-1">
      {categories.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat === 'All Items' && '🍽️'}
            {cat === 'Specials' && '⭐'}
            {cat === 'Meals' && '🍱'}
            {cat === 'Breakfast' && '🥐'}
            {cat === 'Beverages' && '☕'}
            {cat === 'Snacks' && '🥪'}
            {cat === 'Fast Food' && '🍜'}
            {cat === 'Healthy Food' && '🥗'}
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
};
