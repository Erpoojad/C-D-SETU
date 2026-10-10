import React, { useState } from 'react';
import { PickupRequest, PickupStatus } from '../types';
import { X, Truck, CheckCircle2, Clock, MapPin, Phone, ShieldCheck, ArrowRight, Navigation, RefreshCw } from 'lucide-react';

interface PickupTrackerModalProps {
  pickup: PickupRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (pickupId: string, nextStatus: PickupStatus) => void;
}

export const PickupTrackerModal: React.FC<PickupTrackerModalProps> = ({
  pickup,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'details'>('map');

  if (!isOpen || !pickup) return null;

  const statuses: PickupStatus[] = ['Scheduled', 'En route', 'Picked up', 'Disposal complete'];
  const currentIndex = statuses.indexOf(pickup.status);

  const handleNextStep = () => {
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      onUpdateStatus(pickup.id, nextStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Waste Pickup &amp; Route Telemetry
              </h3>
              <p className="text-xs text-slate-500">
                Manifest Code: <strong className="font-mono text-slate-800">{pickup.manifestId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNextStep}
              disabled={currentIndex === statuses.length - 1}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Simulate advancing to next logistics phase"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Advance Status</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Milestone Timeline Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="grid grid-cols-4 gap-2 relative">
            {statuses.map((step, idx) => {
              const isPassed = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step} className="text-center relative">
                  <div className="flex items-center justify-center mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                  </div>
                  <div
                    className={`text-2xs font-semibold whitespace-nowrap ${
                      isCurrent ? 'text-emerald-400 font-bold' : isPassed ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Simulated Real-Time Map & Route View */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 text-white">
            {/* SVG Visual Canvas for GIS Route Simulation */}
            <div className="h-56 w-full relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full absolute inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg">
                {/* Road Grid Pattern */}
                <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.8" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#road-grid)" />

                {/* Simulated Road Arteries */}
                <path
                  d="M 50 140 Q 220 80, 420 120 T 750 90"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 140 Q 220 80, 420 120 T 750 90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Start Pin: Demolition Site */}
              <div className="absolute left-10 top-24 flex flex-col items-center">
                <div className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-3xs font-semibold mb-1 shadow-md">
                  Pickup: {pickup.siteName.slice(0, 16)}...
                </div>
                <div className="w-5 h-5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 flex items-center justify-center text-white text-3xs font-bold">
                  A
                </div>
              </div>

              {/* Vehicle Moving Marker */}
              <div
                className={`absolute transition-all duration-700 flex flex-col items-center ${
                  currentIndex === 0
                    ? 'left-16 top-24'
                    : currentIndex === 1
                    ? 'left-1/2 top-16 -translate-x-1/2'
                    : currentIndex === 2
                    ? 'left-2/3 top-20'
                    : 'right-12 top-14'
                }`}
              >
                <div className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded-md text-3xs shadow-lg mb-1 animate-bounce">
                  {pickup.assignedVehicle?.split(' ')[0] || 'Tipper'} &middot; Active GPS
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg ring-4 ring-emerald-400/30">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              {/* Destination Pin: Recycler / Direct Reuse */}
              <div className="absolute right-8 top-14 flex flex-col items-center">
                <div className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-3xs font-semibold mb-1 shadow-md">
                  Target: {pickup.destinationPlant.slice(0, 18)}...
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-600 ring-4 ring-emerald-500/20 flex items-center justify-center text-white text-3xs font-bold">
                  B
                </div>
              </div>
            </div>

            {/* Live GPS Telemetry Floating Strip */}
            <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300 font-medium">
                  {pickup.currentGps?.label || 'GPS Tracking Active (12.927° N, 77.627° E)'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-2xs text-slate-400 tabular-nums font-mono">
                <span>Speed: 32 km/h</span>
                <span>Distance: 1.8 km</span>
                <span className="text-emerald-400 font-bold">ETA: 11 mins</span>
              </div>
            </div>
          </div>

          {/* Driver & Consignment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Contact Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Transporter
                </span>
                <div className="font-bold text-sm text-slate-900">
                  {pickup.driverName || 'Gurpreet Singh'}
                </div>
                <div className="text-2xs text-slate-500">
                  Vehicle: {pickup.driverVehicleNumber || pickup.assignedVehicle}
                </div>
              </div>

              <a
                href={`tel:${pickup.driverPhone || '+919811490283'}`}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            </div>

            {/* Net Financials & Segregation Status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Consignment Economics
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Load &amp; Segregation:</span>
                <strong className="text-slate-900 tabular-nums">
                  {pickup.estimatedTons} MT &middot; {pickup.isSegregated ? 'Segregated' : 'Mixed'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-600">Net Generator Settlement:</span>
                <strong className={pickup.netPayout >= 0 ? 'text-emerald-700 tabular-nums font-bold' : 'text-slate-900 tabular-nums'}>
                  {pickup.netPayout >= 0 ? '+' : '-'}₹{Math.abs(pickup.netPayout).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* Timeline Milestones Log */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Audit Event Log
            </span>
            <div className="space-y-2 text-xs">
              {pickup.statusTimeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    item.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.status}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="text-2xs">{item.description}</span>
                  </div>
                  <span className="text-2xs font-mono tabular-nums text-slate-500">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-2xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Weighbridge Pass Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
