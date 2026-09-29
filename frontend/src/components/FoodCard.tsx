import React from 'react';
import { Clock, Plus, Minus, CheckCircle, Sparkles } from 'lucide-react';
import { FoodItem } from '../types';

interface FoodCardProps {
  item: FoodItem;
  quantityInCart: number;
  onAddToCart: (item: FoodItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity
}) => {
  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Food Image Container with 16:9 Aspect Ratio to prevent layout shift */}
      <div className="w-full aspect-[16/9] overflow-hidden bg-slate-100 relative">
        <img
          src={item.image}
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/food/placeholder.jpg';
          }}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Badges Overlay on Image */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* 100% Pure Veg Standard Indicator */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm border border-emerald-200">
            <span className="w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-[3px] border-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-emerald-700">
              PURE VEG
            </span>
          </div>

          {/* Special Badge if applicable */}
          {item.isSpecial && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-amber-500 text-white shadow-sm shadow-amber-500/30">
              <Sparkles className="w-3 h-3" /> SPECIAL
            </span>
          )}
        </div>

        {/* Bottom Pill on Image: Category and Prep Time */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm border border-slate-200/60">
            {item.category}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-sm border border-slate-200/60 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            {item.preparationTime}m
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Dish Title */}
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
            {item.name}
          </h3>

          {/* Price & Freshness Tag */}
          <div className="flex items-baseline justify-between mt-1 mb-1.5 flex-wrap gap-1">
            <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              ₹{item.price}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              Freshly prepared today
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-500 text-[11px] sm:text-xs line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        </div>

        {/* Availability & Cart Action */}
        <div className="pt-2 border-t border-slate-100 space-y-2 mt-auto">
          {/* Availability Status */}
          <div className="flex items-center justify-between text-[11px] font-bold">
            {item.available ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Available
              </span>
            ) : (
              <span className="text-slate-400">Out of Stock</span>
            )}
            <span className="text-slate-400 text-[10px]">
              Stock: {item.stock}
            </span>
          </div>

          {/* Action Button */}
          {item.available ? (
            quantityInCart > 0 ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1 shadow-sm w-full">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95"
                  title="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs sm:text-sm font-black text-blue-800 px-2 min-w-[20px] text-center">
                  {quantityInCart} in cart
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95"
                  title="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(item)}
                className="w-full py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>+ Add to Cart</span>
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
