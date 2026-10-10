import React, { useState } from 'react';
import { FLEET_VEHICLES } from '../data/mockData';
import { VehicleOption, PickupRequest } from '../types';
import { X, Truck, Check, MapPin, Calendar, Clock, DollarSign, ShieldCheck, ArrowRight, Phone, Navigation } from 'lucide-react';

interface LogisticsBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (booking: PickupRequest) => void;
  initialEstimatedTons?: number;
  initialMaterial?: string;
  initialSegregated?: boolean;
}

export const LogisticsBookingModal: React.FC<LogisticsBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirmBooking,
  initialEstimatedTons = 4.5,
  initialMaterial = 'concrete',
  initialSegregated = true,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(FLEET_VEHICLES[1]);
  const [siteName, setSiteName] = useState<string>('Brigade Gateway Renovation Lot');
  const [address, setAddress] = useState<string>('Malleshwaram, Bengaluru');
  const [city, setCity] = useState<string>('Bengaluru');
  const [materialType, setMaterialType] = useState<string>(initialMaterial);
  const [isSegregated, setIsSegregated] = useState<boolean>(initialSegregated);
  const [estimatedTons, setEstimatedTons] = useState<number>(initialEstimatedTons);
  const [isPoolingEnabled, setIsPoolingEnabled] = useState<boolean>(true);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [assignedRequest, setAssignedRequest] = useState<PickupRequest | null>(null);

  if (!isOpen) return null;

  // Pricing formula:
  // Transport fee = base fare + (distance * ratePerKm) - (pooling discount if applicable)
  const estimatedDistance = selectedVehicle.currentDistanceKm + 4.2;
  const rawTransportFee = selectedVehicle.baseFare + Math.round(estimatedDistance * selectedVehicle.ratePerKm);
  const transportFee = isPoolingEnabled ? Math.round(rawTransportFee * 0.72) : rawTransportFee;

  // Salvage credit: If segregated, clean concrete gives ₹650/MT, bricks ₹450/MT, metals ₹4200/MT, mixed = ₹0
  let salvageRatePerTon = 0;
  if (isSegregated) {
    if (materialType === 'concrete') salvageRatePerTon = 650;
    else if (materialType === 'brick_masonry') salvageRatePerTon = 480;
    else if (materialType === 'metals') salvageRatePerTon = 3800;
    else salvageRatePerTon = 250;
  }
  const salvageCredit = Math.round(estimatedTons * salvageRatePerTon);
  const netPayout = salvageCredit - transportFee;

  const handleBook = () => {
    const newRequest: PickupRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      siteName,
      address,
      city,
      generatorType: 'Contractor',
      materialType: materialType as any,
      isSegregated,
      estimatedTons,
      assignedVehicle: `${selectedVehicle.category} (${selectedVehicle.vehicleNumber})`,
      vehicleType: selectedVehicle.category,
      status: 'En route',
      driverName: selectedVehicle.driverName,
      driverPhone: selectedVehicle.driverPhone,
      driverVehicleNumber: selectedVehicle.vehicleNumber,
      statusTimeline: [
        { status: 'Scheduled', time: 'Just now', completed: true, description: 'Pickup slot scheduled' },
        { status: 'En route', time: 'Just now', completed: true, description: `${selectedVehicle.category} dispatched to site` },
        { status: 'Picked up', time: 'Pending', completed: false, description: 'Loading & weighbridge tare' },
        { status: 'Disposal complete', time: 'Pending', completed: false, description: 'Delivery & manifest issuance' },
      ],
      currentGps: {
        lat: 12.9341,
        lng: 77.6101,
        label: `${selectedVehicle.driverName} moving on route (${selectedVehicle.etaMinutes} min away)`,
      },
      destinationPlant: isSegregated
        ? 'Channasandra Local Micro-Crusher (3.4 km)'
        : 'Burari Centralized Plant (14.2 km)',
      estimatedSalvageValue: salvageCredit,
      transportFee,
      netPayout,
      pickupTime: 'Today, within 45 mins',
      manifestId: `CD-MANIFEST-2026-${city.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    setAssignedRequest(newRequest);
    setBookingConfirmed(true);
    onConfirmBooking(newRequest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                On-Demand C&amp;D Logistics Dispatch
              </h2>
              <p className="text-xs text-slate-500">
                Book verified tippers &amp; tractor haulers with GPS tracking and instant weighbridge manifest.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingConfirmed && assignedRequest ? (
          /* Confirmation View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">
                Vehicle Dispatched Successfully
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Tipper En Route to {assignedRequest.siteName}
              </h3>
              <p className="text-xs text-slate-500">
                Manifest Code:{' '}
                <strong className="text-slate-800 font-mono">{assignedRequest.manifestId}</strong>
              </p>
            </div>

            {/* Assigned Driver Box */}
            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {selectedVehicle.driverName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedVehicle.driverName}
                    </div>
                    <div className="text-2xs text-slate-500">
                      {selectedVehicle.vehicleNumber} &middot; Rating {selectedVehicle.driverRating} &starf;
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${selectedVehicle.driverPhone}`}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-2xs text-slate-600 border-t border-slate-200 pt-2 tabular-nums">
                <div>
                  ETA to Site:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {selectedVehicle.etaMinutes} mins
                  </strong>
                </div>
                <div>
                  Live Distance:{' '}
                  <strong className="text-slate-900 font-bold">
                    {selectedVehicle.currentDistanceKm} km away
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>
                    {assignedRequest.netPayout >= 0 ? 'Generator Net Salvage Earnings:' : 'Net Transport Fee:'}
                  </span>
                  <span
                    className={
                      assignedRequest.netPayout >= 0
                        ? 'text-emerald-700 tabular-nums'
                        : 'text-slate-900 tabular-nums'
                    }
                  >
                    {assignedRequest.netPayout >= 0 ? '+' : '-'}₹
                    {Math.abs(assignedRequest.netPayout).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-2xs text-slate-400 mt-0.5">
                  Gross Weighbridge slip will finalize exact tons upon plant arrival.
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="p-6 space-y-6">
            {/* Step 1: Vehicle Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                1. Select Carrier Vehicle (Matching Road Width &amp; Load)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FLEET_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedVehicle.id === v.id
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{v.category}</span>
                      <span className="text-2xs font-semibold text-emerald-700 tabular-nums">
                        Up to {v.capacityTons} MT
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 line-clamp-1">{v.idealFor}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-2xs text-slate-600 tabular-nums">
                      <span>Base: ₹{v.baseFare}</span>
                      <span className="text-emerald-700 font-semibold">{v.etaMinutes} min away</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Site Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Site / Project Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Prestige Villa Renovation Site"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Pickup Address &amp; Street
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Sector 62, Gate 3"
                />
              </div>
            </div>

            {/* Step 3: Waste Details & Segregation Incentive */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Primary Material
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="concrete">Concrete Rubble (Demolition)</option>
                    <option value="brick_masonry">Brick Masonry &amp; Mortar</option>
                    <option value="metals">Structural Steel &amp; Rebar Scrap</option>
                    <option value="soil_gravel">Excavated Soil &amp; Earth</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">Estimated Weight</span>
                    <span className="text-emerald-700 tabular-nums">{estimatedTons} MT</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={selectedVehicle.capacityTons}
                    step="0.5"
                    value={estimatedTons}
                    onChange={(e) => setEstimatedTons(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs text-slate-400 mt-0.5">
                    <span>1 MT</span>
                    <span>Max {selectedVehicle.capacityTons} MT</span>
                  </div>
                </div>
              </div>

              {/* Segregation and Pooling Switches */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSegregated}
                    onChange={(e) => setIsSegregated(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Material is Segregated at Source (Clean rubble, no plastics/garbage)
                    </span>
                    <span className="text-2xs text-emerald-700 block font-medium">
                      &check; Unlocks salvage payout (+₹{salvageCredit.toLocaleString('en-IN')}) &amp; direct reuse routing.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPoolingEnabled}
                    onChange={(e) => setIsPoolingEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Enable Small-Lot Aggregated Pickup (28% freight discount)
                    </span>
                    <span className="text-2xs text-slate-500 block">
                      Matches tipper with another nearby pickup along the route.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Summary Fare Breakdown */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Haulage &amp; Fuel ({estimatedDistance.toFixed(1)} km)</span>
                <span className="tabular-nums font-mono">₹{rawTransportFee.toLocaleString('en-IN')}</span>
              </div>
              {isPoolingEnabled && (
                <div className="flex justify-between text-emerald-400">
                  <span>Small-Lot Route Pooling Discount</span>
                  <span className="tabular-nums font-mono">
                    -₹{(rawTransportFee - transportFee).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {isSegregated && (
                <div className="flex justify-between text-emerald-300 font-semibold">
                  <span>Recycler Salvage Purchase Credit ({estimatedTons} MT)</span>
                  <span className="tabular-nums font-mono">+₹{salvageCredit.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold items-center">
                <span>
                  {netPayout >= 0 ? 'Net Salvage Earnings to Generator:' : 'Final Transport Payable:'}
                </span>
                <span className={netPayout >= 0 ? 'text-emerald-400 text-base font-extrabold tabular-nums' : 'text-white text-base font-extrabold tabular-nums'}>
                  {netPayout >= 0 ? '+' : '-'}₹{Math.abs(netPayout).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <span>Confirm Tipper Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
