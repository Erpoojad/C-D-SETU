import React, { useState } from 'react';
import { MaterialListing } from '../types';
import { X, Check, Truck, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

interface MaterialOrderModalProps {
  listing: MaterialListing | null;
  onClose: () => void;
  onOrderSuccess: (details: { listingTitle: string; quantity: number; totalCost: number }) => void;
}

export const MaterialOrderModal: React.FC<MaterialOrderModalProps> = ({
  listing,
  onClose,
  onOrderSuccess,
}) => {
  const [orderQuantity, setOrderQuantity] = useState<number>(20);
  const [deliverySite, setDeliverySite] = useState<string>('Metro Corridor Station #12 Construction Site');
  const [distanceKm, setDistanceKm] = useState<number>(listing ? listing.distanceKm : 5);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);

  if (!listing) return null;

  const baseMaterialCost = orderQuantity * listing.pricePerUnit;
  // Freight cost approx ₹45 / ton / km
  const freightCost = Math.round(orderQuantity * distanceKm * 42);
  const totalCost = baseMaterialCost + freightCost;

  // Savings comparison vs virgin quarry material
  const virginQuarryCost = (listing.originalPricePerUnit || listing.pricePerUnit * 1.8) * orderQuantity + freightCost;
  const moneySaved = Math.max(0, virginQuarryCost - totalCost);
  const co2AvoidedKg = Math.round(orderQuantity * listing.co2SavedKgPerUnit);

  const handleConfirmOrder = () => {
    setIsOrdered(true);
    setTimeout(() => {
      onOrderSuccess({
        listingTitle: listing.title,
        quantity: orderQuantity,
        totalCost,
      });
      setIsOrdered(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Procure Recycled Circular Aggregate
            </h3>
            <p className="text-xs text-slate-500">
              Direct order from verified stockpile with NABL IS 383:2016 test pass slip.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isOrdered ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Consignment Booked!</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Dispatch schedule reserved for {orderQuantity} {listing.unit} of {listing.title}. Tipper route assigned from {listing.sellerName}.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5 text-xs">
            {/* Listing Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                <img
                  src={listing.image}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-2xs text-emerald-700 font-bold block">{listing.grade}</span>
                <div className="font-bold text-slate-900 text-sm">{listing.title}</div>
                <div className="text-slate-500 text-2xs">
                  Seller: {listing.sellerName} &middot; {listing.location} ({listing.distanceKm} km away)
                </div>
              </div>
            </div>

            {/* Quantity Slider */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Order Quantity</span>
                <span className="text-emerald-700 font-bold tabular-nums">
                  {orderQuantity} {listing.unit}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={Math.min(100, listing.quantity)}
                step="5"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-2xs text-slate-400 mt-1">
                <span>5 {listing.unit}</span>
                <span>Max {listing.quantity} {listing.unit} in stock</span>
              </div>
            </div>

            {/* Delivery Site Destination */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Destination Site / Batching Plant
              </label>
              <input
                type="text"
                value={deliverySite}
                onChange={(e) => setDeliverySite(e.target.value)}
                placeholder="e.g. Indiranagar Metro Station Project Yard"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Price & Savings Breakdown */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Material Cost ({orderQuantity} {listing.unit} &times; ₹{listing.pricePerUnit})</span>
                <span className="tabular-nums font-mono">₹{baseMaterialCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Haulage Freight ({distanceKm} km transit)</span>
                <span className="tabular-nums font-mono">₹{freightCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold">
                <span>Total Payable (incl. GST &amp; Weighbridge):</span>
                <span className="text-emerald-400 font-extrabold tabular-nums">
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Savings callout */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-2xs">
                <span className="text-emerald-300">
                  You save &asymp; ₹{moneySaved.toLocaleString('en-IN')} vs virgin quarry stone!
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  &darr; {co2AvoidedKg.toLocaleString('en-IN')} kg CO₂
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg transition-colors shadow-xs"
              >
                <span>Confirm Purchase &amp; Tipper Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
