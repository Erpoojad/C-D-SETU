import React, { useState } from 'react';
import { MaterialListing, MaterialCategory } from '../types';
import { X, Plus, Sparkles, Upload, DollarSign, Check, ShieldCheck, ArrowRight } from 'lucide-react';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (listing: MaterialListing) => void;
  sellerCity?: string;
  sellerName?: string;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  sellerCity = 'Bengaluru',
  sellerName = 'Apex Deconstruction Ltd',
}) => {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<MaterialCategory>('concrete');
  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState<'MT' | 'Tons' | 'CFT' | 'Nos'>('MT');
  const [isFree, setIsFree] = useState<boolean>(false);
  const [pricePerUnit, setPricePerUnit] = useState<number>(650);
  const [location, setLocation] = useState<string>('');
  const [city, setCity] = useState<string>(sellerCity);
  const [condition, setCondition] = useState<MaterialListing['condition']>('Segregated & Graded');
  const [description, setDescription] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('+91 98450 12345');
  const [isIS383, setIsIS383] = useState<boolean>(false);
  const [sampleImage, setSampleImage] = useState<string>(
    '/src/assets/images/material_recycled_aggregates_1791642686421.jpg'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    let defaultImg = sampleImage;
    if (category === 'brick_masonry') {
      defaultImg = '/src/assets/images/material_reclaimed_bricks_1791642698748.jpg';
    } else if (category === 'metals' || category === 'soil_gravel') {
      defaultImg = '/src/assets/images/hero_cd_recycling_1791642672171.jpg';
    }

    const newListing: MaterialListing = {
      id: `mat-${Date.now().toString().slice(-4)}`,
      title,
      category,
      grade: isIS383 ? 'IS 383:2016 Certified' : 'Clean Reclaimed Lot',
      quantity,
      unit,
      pricePerUnit: isFree ? 0 : pricePerUnit,
      isFree,
      originalPricePerUnit: isFree ? 400 : Math.round(pricePerUnit * 1.6),
      location,
      city,
      distanceKm: +(Math.random() * 6 + 1.5).toFixed(1),
      sellerName,
      sellerPhone,
      sellerType: 'Contractor',
      isVerified: true,
      isIS383Certified: isIS383,
      labSpecs: isIS383
        ? {
            aivValue: '22.1% (Compliant)',
            crushingStrength: '29.0 N/mm²',
            waterAbsorption: '3.6%',
            siltContent: '0.9%',
          }
        : undefined,
      image: defaultImg,
      condition,
      co2SavedKgPerUnit: category === 'concrete' ? 42 : category === 'metals' ? 1650 : 18,
      availableFrom: 'Immediate Loadout',
      description,
    };

    onListingCreated(newListing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              List Surplus / Recyclable Material
            </h3>
            <p className="text-xs text-slate-500">
              Sell recovered masonry, concrete RCA, or list free excavated earth for foundation backfilling.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Material Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean Crushed Brick Bats for Road Subgrade"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="concrete">Concrete &amp; RCA</option>
                <option value="brick_masonry">Brick &amp; Masonry</option>
                <option value="metals">Salvaged Steel / Rebar</option>
                <option value="soil_gravel">Excavated Earth &amp; Fill</option>
                <option value="wood">Timber &amp; Formwork</option>
                <option value="others">Other Recyclables</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Material Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Segregated & Graded">Segregated &amp; Graded</option>
                <option value="Clean Demolition">Clean Demolition</option>
                <option value="Crushed Aggregates">Crushed Aggregates</option>
                <option value="Raw Rubble">Raw Rubble</option>
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Available Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MT">MT (Tonnes)</option>
                <option value="CFT">CFT (Cubic Feet)</option>
                <option value="Nos">Nos (Bricks/Blocks)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="font-semibold text-slate-700 block mb-1">
                Pricing (₹ / {unit})
              </label>
              <input
                type="number"
                disabled={isFree}
                value={isFree ? 0 : pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Free Exchange / Donation Toggle */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-900 block">
                Free / Exchange Lot (Zero Cost to Buyer)
              </span>
              <span className="text-2xs text-emerald-700">
                Offer clean soil, brick bats, or subgrade fill for free direct site pickup to avoid disposal fees.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
            />
          </div>

          {/* Location & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Site Location / Street *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ring Road Plot #44, Indiranagar"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* IS 383 Certification Switch */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="is383-create"
              type="checkbox"
              checked={isIS383}
              onChange={(e) => setIsIS383(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
            />
            <label htmlFor="is383-create" className="font-semibold text-slate-700 cursor-pointer">
              IS 383:2016 Compliant / Lab Tested Stockpile
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Short Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clean M30 concrete rubble from column cutting. Free of plaster or wood."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs text-emerald-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Listing earns +40 Green Reputation Points</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <span>Publish to Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
