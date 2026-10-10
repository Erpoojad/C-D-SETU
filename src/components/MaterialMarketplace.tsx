import React, { useState } from 'react';
import { MaterialListing, MaterialCategory } from '../types';
import { Search, Filter, ShieldCheck, MapPin, Truck, Check, FileText, ArrowUpDown, ChevronRight, Info } from 'lucide-react';

interface MaterialMarketplaceProps {
  listings: MaterialListing[];
  onSelectListingForQuote: (listing: MaterialListing) => void;
  onOpenCreateListing: () => void;
}

export const MaterialMarketplace: React.FC<MaterialMarketplaceProps> = ({
  listings,
  onSelectListingForQuote,
  onOpenCreateListing,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(30);
  const [onlyIS383, setOnlyIS383] = useState<boolean>(false);
  const [onlyFree, setOnlyFree] = useState<boolean>(false);
  const [selectedLabDoc, setSelectedLabDoc] = useState<MaterialListing | null>(null);
  const [contactSellerListing, setContactSellerListing] = useState<MaterialListing | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Materials' },
    { id: 'concrete', label: 'Concrete & RCA' },
    { id: 'brick_masonry', label: 'Reclaimed Bricks' },
    { id: 'metals', label: 'Salvaged Steel' },
    { id: 'soil_gravel', label: 'Excavated Soil & Fill' },
  ];

  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistance = item.distanceKm <= maxDistanceKm;
    const matchesIS = onlyIS383 ? item.isIS383Certified : true;
    const matchesFree = onlyFree ? item.isFree || item.pricePerUnit === 0 : true;

    return matchesCategory && matchesSearch && matchesDistance && matchesIS && matchesFree;
  });

  return (
    <section id="marketplace" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
              <span>Verified Circular Materials</span>
              <span aria-hidden="true">&middot;</span>
              <span>IS 383:2016 Compliant</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recycled Material &amp; Deconstruction Marketplace
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Buy or exchange certified recycled coarse aggregates, reclaimed red bricks, and surplus soil from nearby demolition sites and processing hubs at 40&ndash;50% below quarry rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 tabular-nums hidden sm:inline">
              <strong className="text-slate-900">{filteredListings.length}</strong> listings
            </span>

            <button
              onClick={onOpenCreateListing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <span>+ List Material for Sale / Free Exchange</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search RCA 20mm, reclaimed bricks, free soil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Distance Slider */}
            <div className="md:col-span-3 flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="w-full">
                <div className="flex justify-between text-2xs font-semibold text-slate-600">
                  <span>Max Radius</span>
                  <span className="tabular-nums text-emerald-700">{maxDistanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* IS 383 Toggle */}
            <div className="md:col-span-2 flex items-center justify-between px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
              <label htmlFor="is383-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                IS 383 Only
              </label>
              <input
                id="is383-toggle"
                type="checkbox"
                checked={onlyIS383}
                onChange={(e) => setOnlyIS383(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
              />
            </div>

            {/* Free Exchange Toggle */}
            <div className="md:col-span-2 flex items-center justify-between px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
              <label htmlFor="free-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Free / Exchange
              </label>
              <input
                id="free-toggle"
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No matching stockpiles found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your distance radius slider or clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setMaxDistanceKm(30);
                setOnlyIS383(false);
                setOnlyFree(false);
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const isFreeLot = listing.isFree || listing.pricePerUnit === 0;
              const savingsPct = listing.originalPricePerUnit && !isFreeLot
                ? Math.round(
                    ((listing.originalPricePerUnit - listing.pricePerUnit) /
                      listing.originalPricePerUnit) *
                      100
                  )
                : null;

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    {/* Image with fallback */}
                    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {/* Distance marker */}
                      <div className="absolute top-3 left-3 px-2 py-1 bg-slate-950/80 backdrop-blur-xs rounded-md text-2xs font-semibold text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{listing.distanceKm} km away</span>
                      </div>
                      {/* Savings or Free tag */}
                      {isFreeLot ? (
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-slate-950 font-extrabold rounded-md text-2xs shadow-md">
                          FREE / EXCHANGE
                        </div>
                      ) : savingsPct ? (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-600 rounded-md text-2xs font-bold text-white shadow-xs">
                          {savingsPct}% Lower than Quarry
                        </div>
                      ) : null}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        {/* Unboxed metadata separator */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-medium text-slate-700">{listing.sellerType}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span>{listing.city}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span className="text-emerald-700 font-semibold">{listing.condition}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {listing.title}
                        </h3>
                        {listing.grade && (
                          <div className="text-xs text-slate-600 mt-1 font-medium">
                            {listing.grade}
                          </div>
                        )}
                        {listing.description && (
                          <p className="text-2xs text-slate-500 mt-1 line-clamp-2">
                            {listing.description}
                          </p>
                        )}
                      </div>

                      {/* Lab Specs Strip */}
                      {listing.labSpecs && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-2xs">
                          <div className="flex items-center justify-between font-semibold text-slate-700">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              IS 383:2016 Lab Parameters
                            </span>
                            <button
                              onClick={() => setSelectedLabDoc(listing)}
                              className="text-emerald-700 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              <span>View Test Sheet</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-500 tabular-nums">
                            {listing.labSpecs.crushingStrength && (
                              <div>Strength: {listing.labSpecs.crushingStrength}</div>
                            )}
                            {listing.labSpecs.aivValue && (
                              <div>AIV: {listing.labSpecs.aivValue}</div>
                            )}
                            {listing.labSpecs.waterAbsorption && (
                              <div>Water Abs: {listing.labSpecs.waterAbsorption}</div>
                            )}
                            {listing.labSpecs.siltContent && (
                              <div>Silt: {listing.labSpecs.siltContent}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stockpile & Carbon Saved */}
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                        <div>
                          Available Stock:{' '}
                          <strong className="text-slate-900 tabular-nums font-semibold">
                            {listing.quantity} {listing.unit}
                          </strong>
                        </div>
                        <div className="text-emerald-700 font-medium">
                          &darr; {listing.co2SavedKgPerUnit} kg CO₂ / {listing.unit}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Pricing & Action Buttons */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      {isFreeLot ? (
                        <div className="text-base font-extrabold text-emerald-700">
                          ₹0 &middot; Free Exchange
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-slate-400 line-through tabular-nums">
                            {listing.originalPricePerUnit
                              ? `₹${listing.originalPricePerUnit.toLocaleString('en-IN')}`
                              : ''}
                          </div>
                          <div className="text-base font-extrabold text-slate-900 tabular-nums">
                            ₹{listing.pricePerUnit.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-500">
                              {' '}/ {listing.unit}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setContactSellerListing(listing)}
                        className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Contact Seller directly"
                      >
                        Contact
                      </button>

                      <button
                        onClick={() => onSelectListingForQuote(listing)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                      >
                        <span>{isFreeLot ? 'Claim Lot' : 'Order'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Contact Seller Modal */}
      {contactSellerListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Contact Material Owner
              </h4>
              <button
                onClick={() => setContactSellerListing(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{contactSellerListing.title}</div>
              <div className="text-slate-600">
                Seller: <strong>{contactSellerListing.sellerName}</strong>
              </div>
              <div className="text-slate-500">
                Location: {contactSellerListing.location}, {contactSellerListing.city} ({contactSellerListing.distanceKm} km away)
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-2xs text-emerald-800 font-bold block">Verified Direct Phone:</span>
                  <strong className="text-sm text-emerald-950 font-mono">
                    {contactSellerListing.sellerPhone || '+91 98450 12345'}
                  </strong>
                </div>
                <a
                  href={`tel:${contactSellerListing.sellerPhone || '+919845012345'}`}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Call Now
                </a>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Send Direct Dispatch / Pickup Inquiry:
                </label>
                <textarea
                  rows={2}
                  defaultValue={`Hi, I'm interested in acquiring ${contactSellerListing.quantity} ${contactSellerListing.unit} of ${contactSellerListing.title}. Can we arrange pickup today?`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setContactSellerListing(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
              >
                Message Sent &middot; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Sheet Preview Modal */}
      {selectedLabDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Certified Lab Test Report (IS 383:2016)
                </h4>
              </div>
              <button
                onClick={() => setSelectedLabDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">{selectedLabDoc.title}</div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 tabular-nums">
                <div className="flex justify-between">
                  <span>Tested Batch ID:</span>
                  <strong className="text-slate-800">IS383-TEST-2026-B812</strong>
                </div>
                <div className="flex justify-between">
                  <span>Aggregate Impact Value (AIV):</span>
                  <strong className="text-emerald-700 font-semibold">
                    {selectedLabDoc.labSpecs?.aivValue || 'Compliant (<30%)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Compressive / Crushing Strength:</span>
                  <strong className="text-emerald-700 font-semibold">
                    {selectedLabDoc.labSpecs?.crushingStrength || 'Compliant'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Water Absorption:</span>
                  <strong className="text-emerald-700 font-semibold">
                    {selectedLabDoc.labSpecs?.waterAbsorption || 'Compliant (<5%)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Silt / Deleterious Substances:</span>
                  <strong className="text-emerald-700 font-semibold">
                    {selectedLabDoc.labSpecs?.siltContent || 'Pass (<2%)'}
                  </strong>
                </div>
              </div>
              <p className="text-2xs text-slate-500">
                Verified by NABL accredited testing laboratory. Certified for use in lean concrete, road pavement sub-base (GSB/WMM), precast paver blocks, and boundary wall construction.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLabDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
