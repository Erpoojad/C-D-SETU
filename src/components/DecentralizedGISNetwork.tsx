import React, { useState } from 'react';
import { FACILITY_NODES } from '../data/mockData';
import { FacilityNode } from '../types';
import { MapPin, Navigation, Truck, Cpu, ArrowRight, ShieldCheck, DollarSign, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const DecentralizedGISNetwork: React.FC = () => {
  const [activeTier, setActiveTier] = useState<'tier2' | 'tier1'>('tier2');
  const [selectedCity, setSelectedCity] = useState<string>('Nashik');
  const [mobileCrusherRequested, setMobileCrusherRequested] = useState<boolean>(false);

  const tier2Facilities = FACILITY_NODES.filter((f) => f.cityTier !== 'Tier 1');
  const tier1Facilities = FACILITY_NODES.filter((f) => f.cityTier === 'Tier 1');

  const displayedFacilities = activeTier === 'tier2' ? tier2Facilities : tier1Facilities;

  // Comparison metrics for the user's primary concern
  const comparison = {
    centralized: {
      distance: 145, // km to distant metro plant
      freightCostPerTon: 2175, // ₹15/km/ton
      plantProcessingFee: 350,
      totalCostToBuyer: 3200,
      carbonKgPerTon: 68,
      viability: 'Economically Unviable (Forces illegal dumping)',
    },
    decentralized: {
      distance: 3.8, // km within local city cluster
      freightCostPerTon: 190,
      plantProcessingFee: 140, // mobile micro-crusher / direct reuse
      totalCostToBuyer: 680, // affordable circular aggregate!
      carbonKgPerTon: 4.2,
      viability: 'Highly Profitable (Unlocks 90%+ local reuse)',
    },
  };

  return (
    <section id="decentralized-network" className="py-16 bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <span>Solving India&apos;s Small-City C&amp;D Crisis</span>
            <span aria-hidden="true">&middot;</span>
            <span>Decentralized GIS Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Decentralized Micro-Crushers &amp; Hyper-Local P2P GIS Routing
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Centralized multi-crore recycling plants only exist in big metros like Delhi or Mumbai. Transporting rubble 150 km from Tier-2 and Tier-3 towns makes recycling unviable. C&amp;D Setu solves this with mobile trailer crushers, Ward Malba Banks, and hyper-local peer-to-peer site matching.
          </p>
        </div>

        {/* Strategy Switcher: Tier-2 Small Cities vs Metro Centralized */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Operating Topology
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {activeTier === 'tier2'
                  ? 'Decentralized Cluster Mode (Tier-2 & Tier-3 Small Cities)'
                  : 'Centralized Mega-Plant Mode (Tier-1 Metros Only)'}
              </h3>
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTier('tier2')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTier === 'tier2'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Small Cities &amp; Towns (Decentralized)
              </button>
              <button
                onClick={() => setActiveTier('tier1')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTier === 'tier1'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mega Metros (Centralized)
              </button>
            </div>
          </div>

          {/* Core Innovation: 3 Pillars for Small Cities */}
          {activeTier === 'tier2' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-bold text-sm text-white">
                  Mobile Trailer Micro-Crushers (DMCUs)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Portable 40&ndash;80 TPD impact crushers mounted on trailers that travel to demolition sites. They crush concrete slabs right on site into road sub-base (GSB) for ₹140/ton, eliminating long hauling completely.
                </p>
              </div>

              <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-bold text-sm text-white">
                  Hyper-Local P2P Direct Matching
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  GIS algorithm connects Site A (demolishing an old structure) with Site B (plinth filling or highway widening) within 3&ndash;5 km. Rubble never leaves the city.
                </p>
              </div>

              <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-bold text-sm text-white">
                  Municipal Ward Malba Banks
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  500 sq. yard designated municipal screening yards in every ward. Local tractors drop small renovation loads (1&ndash;3 MT), screened and repurposed locally.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
              <strong className="text-white">Centralized Plants (e.g. Burari, Shastri Park):</strong>{' '}
              Capital intensive (₹40+ Crores), require 15+ acres of land, and process 1,000&ndash;2,000 TPD. While effective for massive capital cities, they are unavailable in 95% of Indian districts.
            </div>
          )}

          {/* Head-to-Head Economics: Distant Hauling vs Setu Decentralized */}
          <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                Economic Reality: Cost Breakdown per Ton of C&amp;D Waste
              </h4>
              <span className="text-2xs text-emerald-400 font-semibold">
                Why Small City Projects Save 78% with Setu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Distant Metro Haul */}
              <div className="p-4 bg-slate-950 rounded-xl border border-red-900/40 space-y-2.5">
                <div className="flex justify-between items-center text-red-400 font-bold">
                  <span>Hauling Rubble to Distant Metro Plant</span>
                  <span>145 km</span>
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Intercity Tipper Freight (145 km):</span>
                    <span className="font-mono text-white tabular-nums">
                      ₹{comparison.centralized.freightCostPerTon} / MT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Centralized Plant Tipping Charge:</span>
                    <span className="font-mono text-white tabular-nums">
                      ₹{comparison.centralized.plantProcessingFee} / MT
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-red-400">
                    <span>Total Disposal Overhead:</span>
                    <span className="font-mono tabular-nums">₹2,525 / MT</span>
                  </div>
                </div>
                <div className="text-2xs text-red-400/90 font-medium">
                  Result: Buyer/Seller in massive loss. Resulted in rampant illegal dumping.
                </div>
              </div>

              {/* Setu Decentralized Micro-Crusher */}
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-2.5">
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>C&amp;D Setu Decentralized Cluster Network</span>
                  <span>3.8 km</span>
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Local Tractor / Tipper Haul (3.8 km):</span>
                    <span className="font-mono text-white tabular-nums">
                      ₹{comparison.decentralized.freightCostPerTon} / MT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Site Mobile Crusher Fee:</span>
                    <span className="font-mono text-white tabular-nums">
                      ₹{comparison.decentralized.plantProcessingFee} / MT
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-emerald-400">
                    <span>Total Processing &amp; Transit:</span>
                    <span className="font-mono tabular-nums">₹330 / MT</span>
                  </div>
                </div>
                <div className="text-2xs text-emerald-400 font-medium">
                  Result: 87% cheaper! Both builder and local contractor make a healthy profit.
                </div>
              </div>
            </div>
          </div>

          {/* Active Nodes Grid for Selected Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active GIS Resource Nodes in Network
              </h4>
              <span className="text-2xs text-slate-500">Live Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedFacilities.map((node) => (
                <div
                  key={node.id}
                  className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-3xs text-emerald-400 font-bold uppercase block">
                        {node.type}
                      </span>
                      <div className="font-bold text-xs text-white mt-0.5">{node.name}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-3xs font-semibold">
                      {node.city}
                    </span>
                  </div>

                  <p className="text-2xs text-slate-400 line-clamp-1">{node.address}</p>

                  <div className="flex items-center justify-between text-2xs text-slate-400 pt-2 border-t border-slate-800 tabular-nums">
                    <span>Capacity: {node.capacityTPD} TPD</span>
                    <span className="text-emerald-400 font-bold">
                      {node.processingCostPerTon === 0
                        ? 'Zero Processing Fee'
                        : `₹${node.processingCostPerTon}/T Fee`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Request Mobile Crusher Action */}
          <div className="p-4 bg-emerald-950/60 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Operating in a Tier-2/Tier-3 Town with no plant?</span>
              </div>
              <p className="text-2xs text-slate-300 mt-0.5">
                Dispatch an on-demand trailer-mounted mobile micro-crusher to your site for bulk on-site crushing.
              </p>
            </div>

            <button
              onClick={() => setMobileCrusherRequested(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg text-xs whitespace-nowrap transition-colors"
            >
              {mobileCrusherRequested ? 'Crusher Request Logged!' : 'Request Mobile Micro-Crusher'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
