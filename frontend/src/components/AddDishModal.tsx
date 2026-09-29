import React, { useState } from 'react';
import { X, Upload, Plus, AlertCircle, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { FoodItem } from '../types';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDishCreated: (dish: FoodItem) => void;
}

const CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Beverages',
  'Meals',
  'Fast Food',
  'Healthy Food',
  'Special Items'
];

const PRESET_REAL_PHOTOS = [
  { label: 'Veg Biryani', path: '/images/food/biryani.jpg' },
  { label: 'Masala Dosa', path: '/images/food/masala-dosa.jpg' },
  { label: 'Paneer Roll', path: '/images/food/paneer-roll.jpg' },
  { label: 'Veg Burger', path: '/images/food/veg-burger.jpg' },
  { label: 'Cheese Pizza', path: '/images/food/pizza.jpg' },
  { label: 'Samosa', path: '/images/food/samosa.jpg' },
  { label: 'Medu Vada', path: '/images/food/vada.jpg' },
  { label: 'Steamed Idli', path: '/images/food/idli.jpg' },
  { label: 'South Veg Meals', path: '/images/food/veg-meals.jpg' },
  { label: 'Special Executive Thali', path: '/images/food/special-meal.jpg' },
  { label: 'Curd Rice', path: '/images/food/curd-rice.jpg' },
  { label: 'Bisi Bele Bath', path: '/images/food/bisibele-bath.jpg' },
  { label: 'Sambar Rice', path: '/images/food/sambar-rice.jpg' },
  { label: 'Lemon Rice', path: '/images/food/lemon-rice.jpg' },
  { label: 'Fruit Bowl', path: '/images/food/fruit-bowl.jpg' },
  { label: 'Protein Sprouts Salad', path: '/images/food/sprouts-salad.jpg' },
  { label: 'Grilled Sandwich', path: '/images/food/sandwich.jpg' },
  { label: 'Hakka Noodles', path: '/images/food/noodles.jpg' },
  { label: 'Masala Maggi', path: '/images/food/maggi.jpg' },
  { label: 'Aloo Paratha', path: '/images/food/paratha.jpg' },
  { label: 'Filter Coffee', path: '/images/food/coffee.jpg' },
  { label: 'Masala Chai', path: '/images/food/tea.jpg' },
  { label: 'Fresh Lime Juice', path: '/images/food/juice.jpg' }
];

export const AddDishModal: React.FC<AddDishModalProps> = ({
  isOpen,
  onClose,
  onDishCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(80);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [preparationTime, setPreparationTime] = useState<number | string>(10);
  const [stockQuantity, setStockQuantity] = useState<number | string>(50);
  const [isTodaySpecial, setIsTodaySpecial] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [allergyInfo, setAllergyInfo] = useState('');

  // Image selection or upload
  const [imagePath, setImagePath] = useState(PRESET_REAL_PHOTOS[0].path);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a real photograph (.jpg, .png, .webp).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed.');
      }

      setImagePath(data.imageUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Dish name is required.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Price must be greater than or equal to 0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        category,
        isVegetarian,
        image: imagePath,
        preparationTime: Number(preparationTime) || 10,
        stockQuantity: Number(stockQuantity) || 50,
        isTodaySpecial,
        ingredients: ingredients ? ingredients.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergyInfo: allergyInfo ? allergyInfo.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create new dish in database.');
      }

      const created: FoodItem = {
        id: data.data._id || data.data.id,
        _id: data.data._id,
        name: data.data.name,
        description: data.data.description,
        price: data.data.price,
        category: data.data.category,
        image: data.data.image,
        vegetarian: data.data.isVegetarian,
        available: data.data.isAvailable,
        stock: data.data.stockQuantity,
        preparationTime: data.data.preparationTime,
        isPopular: data.data.popularity > 50,
        isSpecial: data.data.isTodaySpecial
      };

      onDishCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while creating dish.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </span>
              Add New Campus Dish
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Create a new food catalog entry with real photograph & live inventory tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Food Dish Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paneer Fried Rice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Freshly prepared vegetable fried rice with soft paneer cubes and mild spices."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Prep Time (mins)
              </label>
              <input
                type="number"
                min="1"
                required
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Diet & Special toggles */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>🟢 100% PURE VEG</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={isTodaySpecial}
                onChange={(e) => setIsTodaySpecial(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>✨ Today's Special Dish</span>
            </label>
          </div>

          {/* Real Food Photograph Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-black text-slate-900 block flex items-center justify-between">
              <span>Real Food Photograph *</span>
              <span className="text-[11px] font-semibold text-slate-400">
                Real photos only (.jpg, .png, .webp)
              </span>
            </label>

            {/* Current Image Preview */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={imagePath}
                alt="Dish preview"
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm bg-white flex-shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  Selected: {imagePath}
                </span>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Real Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                    />
                  </label>

                  <span className="text-[11px] text-slate-400 font-medium">or pick from canteen gallery below</span>
                </div>
              </div>
            </div>

            {/* Quick Gallery Picker */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                Quick-Select Real Canteen Photograph:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                {PRESET_REAL_PHOTOS.map(p => (
                  <button
                    type="button"
                    key={p.path}
                    onClick={() => setImagePath(p.path)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                      imagePath === p.path ? 'border-blue-600 shadow-md scale-95' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={p.path} alt={p.label} className="w-full h-12 object-cover rounded" />
                    <span className="text-[9px] font-bold text-slate-700 block truncate text-center mt-0.5">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Ingredients (comma-separated)
              </label>
              <input
                type="text"
                placeholder="Basmati Rice, Paneer, Capsicum, Soy Sauce"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Allergens (comma-separated)
              </label>
              <input
                type="text"
                placeholder="Dairy, Gluten, Soy"
                value={allergyInfo}
                onChange={(e) => setAllergyInfo(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Saving to Database...' : 'Save & Publish Dish to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
