import React, { useState } from 'react';
import { FACILITY_NODES } from '../data/mockData';
import { MaterialCategory } from '../types';
import { GitBranch, MapPin, Navigation, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Fuel, Leaf } from 'lucide-react';

export const SmartRoutingEngine: React.FC = () => {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCategory>('concrete');
  const [lotTonnage, setLotTonnage] = useState<number>(8);
  const [isSegregated, setIsSegregated] = useState<boolean>(true);
  const [enableSmallLotPooling, setEnableSmallLotPooling] = useState<boolean>(true);

  // Compute simulated route outcome based on C&D Setu rules
  let destinationType = '';
  let destinationName = '';
  let distanceKm = 0;
  let transportCost = 0;
  let carbonKg = 0;
  let salvageRecoveryRate = 0;
  let explanation = '';

  if (isSegregated && lotTonnage <= 10) {
    destinationType = 'Tier 1: Direct Site-to-Site Reuse (Nearby Construction)';
    destinationName = 'NHAI Expressway Service Road / Metro Pavement Foundation';
    distanceKm = 3.8;
    salvageRecoveryRate = 95;
    transportCost = enableSmallLotPooling ? 1850 : 2800;
    carbonKg = 210;
    explanation = 'Segregated clean concrete matches immediate subgrade fill requirements of a project 3.8 km away. Zero processing delay and maximum payout.';
  } else if (isSegregated && lotTonnage > 10) {
    destinationType = 'Tier 2: Decentralized Micro-Crushing Hub';
    destinationName = 'Channasandra Local Crushing & Sorting Yard';
    distanceKm = 6.4;
    salvageRecoveryRate = 90;
    transportCost = 3900;
    carbonKg = 340;
    explanation = 'Bulk clean rubble routed to nearest local crusher to turn into IS 383:2016 Grade II coarse aggregates for local precast pavers.';
  } else {
    // Unsegregated
    destinationType = 'Tier 3: Centralized Recycling & Mechanical Recovery Plant';
    destinationName = 'Burari Centralized C&D Multi-Fraction Processing Plant';
    distanceKm = 18.2;
    salvageRecoveryRate = 58;
    transportCost = 5400;
    carbonKg = 85;
    explanation = 'Mixed unsegregated waste requires heavy industrial trommel sieving and wet sorting at centralized plant. Generator incurs municipal tipping charge.';
  }

  return (
    <section id="smart-routing" className="py-16 bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <span>Algorithmic Optimization</span>
            <span aria-hidden="true">&middot;</span>
            <span>GIS Proximity Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Smart Matching &amp; Multi-Tier Routing Logic
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Simulate how C&D Setu matches waste sources with the nearest viable destination. Segregation unlocks Tier 1 Direct Reuse, keeping hauling under 5 km and reducing freight by up to 45%.
          </p>
        </div>

        {/* Interactive Engine Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Simulation Controls */}
          <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Simulation Controls</span>
              <span className="text-2xs text-emerald-400 font-semibold">Live Reactive</span>
            </h3>

            {/* Material selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Waste Material Type</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'concrete', label: 'Concrete Rubble' },
                  { id: 'brick_masonry', label: 'Brick & Masonry' },
                  { id: 'soil_gravel', label: 'Excavated Soil' },
                  { id: 'metals', label: 'Demolition Steel' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMaterial(item.id as MaterialCategory)}
                    className={`py-2 px-3 rounded-lg text-left font-medium transition-colors ${
                      selectedMaterial === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tonnage Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Lot Volume / Weight</span>
                <span className="text-emerald-400 tabular-nums">{lotTonnage} MT</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={lotTonnage}
                onChange={(e) => setLotTonnage(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-2xs text-slate-500">
                <span>1 MT (Tractor)</span>
                <span>8 MT (Tipper)</span>
                <span>25 MT (Multi-Axle)</span>
              </div>
            </div>

            {/* Source Segregation Switch */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Segregated at Source?</div>
                <div className="text-2xs text-slate-400 mt-0.5">
                  Clean separate masonry/concrete vs mixed trash
                </div>
              </div>
              <button
                onClick={() => setIsSegregated(!isSegregated)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isSegregated
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {isSegregated ? 'Segregated (Yes)' : 'Mixed Debris (No)'}
              </button>
            </div>

            {/* Small Lot Aggregation Toggle */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Small-Lot Multi-Pickup Aggregation
                </div>
                <div className="text-2xs text-slate-400 mt-0.5">
                  Pools nearby pickups along one tipper run
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSmallLotPooling}
                onChange={(e) => setEnableSmallLotPooling(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Visual Decision Diagram & Route Result */}
          <div className="lg:col-span-7 space-y-6">
            {/* Real-Time Outcome Card */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-emerald-400">
                    Engine Recommendation
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{destinationType}</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xs text-slate-400 block">Haulage Distance</span>
                  <span className="text-lg font-extrabold text-emerald-400 tabular-nums">
                    {distanceKm} km
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <strong className="text-white">Facility / Target Site:</strong> {destinationName}
                <p className="mt-1 text-slate-400">{explanation}</p>
              </div>

              {/* Dynamic Impact Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-2xs text-slate-400 mb-1">Recovery Rate</div>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">
                    {salvageRecoveryRate}%
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-2xs text-slate-400 mb-1">Freight Cost</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    ₹{transportCost.toLocaleString('en-IN')}
                  </div>
                  {enableSmallLotPooling && isSegregated && (
                    <span className="text-3xs text-emerald-400 block">34% pooled save</span>
                  )}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-2xs text-slate-400 mb-1">CO₂ Avoided</div>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">
                    {carbonKg} kg
                  </div>
                </div>
              </div>

              {/* Multi-Tier Flow Map (Page 3 Architecture from Presentation) */}
              <div className="pt-2">
                <div className="text-2xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  SIH 2026 Routing Flow Architecture
                </div>
                <div className="space-y-2 text-2xs">
                  <div
                    className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                      destinationType.includes('Tier 1')
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">1. Local Direct Reuse (&lt;5 km)</span>
                      <span>&rarr; Nearby road, basement, foundation</span>
                    </div>
                    {destinationType.includes('Tier 1') && (
                      <span className="text-emerald-400 font-bold">&check; Selected Route</span>
                    )}
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                      destinationType.includes('Tier 2')
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">2. Decentralized Micro-Crusher (5&ndash;10 km)</span>
                      <span>&rarr; Local sorting &amp; mobile crushing</span>
                    </div>
                    {destinationType.includes('Tier 2') && (
                      <span className="text-emerald-400 font-bold">&check; Selected Route</span>
                    )}
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                      destinationType.includes('Tier 3')
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">3. Centralized Plant (15&ndash;25 km)</span>
                      <span>&rarr; Bulk unsegregated multi-fraction recycling</span>
                    </div>
                    {destinationType.includes('Tier 3') && (
                      <span className="text-amber-400 font-bold">&check; Selected Route</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg border border-red-900/60 bg-red-950/20 text-red-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-semibold">Unauthorized Dumping on Roads / Plots</span>
                    </div>
                    <span className="font-bold text-red-400">Strictly Blocked by GPS Manifest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
