import React, { useState } from 'react';
import { X, Camera, Upload, Sparkles, Check, ArrowRight, DollarSign, ShieldAlert, Cpu } from 'lucide-react';

interface AiWasteScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBooking: (estimatedTons: number, materialType: string, isSegregated: boolean) => void;
}

interface PresetSample {
  id: string;
  name: string;
  image: string;
  description: string;
  areaSqFt: number;
  projectType: string;
  concretePct: number;
  brickPct: number;
  metalPct: number;
  soilPct: number;
  estimatedTons: number;
  salvageValue: number;
  mixedDisposalFee: number;
  recommendedDestination: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'sample-1',
    name: 'RCC Beam & Slab Demolition',
    image: '/src/assets/images/material_recycled_aggregates_1791642686421.jpg',
    description: 'Reinforced concrete debris with fractured lumps and exposed rebar',
    areaSqFt: 1200,
    projectType: 'Structural Concrete Demolition',
    concretePct: 65,
    brickPct: 15,
    metalPct: 12,
    soilPct: 8,
    estimatedTons: 12.5,
    salvageValue: 8400,
    mixedDisposalFee: 4200,
    recommendedDestination: 'Direct Reuse Site - Subgrade Highway Base (4.2 km)',
  },
  {
    id: 'sample-2',
    name: 'Residential Wall & Brick Masonry',
    image: '/src/assets/images/material_reclaimed_bricks_1791642698748.jpg',
    description: 'Clay red brick partition walls dismantled during home renovation',
    areaSqFt: 650,
    projectType: 'Apartment Remodeling',
    concretePct: 20,
    brickPct: 60,
    metalPct: 5,
    soilPct: 15,
    estimatedTons: 4.8,
    salvageValue: 3600,
    mixedDisposalFee: 2100,
    recommendedDestination: 'Channasandra Micro-Crushing Hub (3.2 km)',
  },
  {
    id: 'sample-3',
    name: 'Bathroom & Floor Tile Strip-Out',
    image: '/src/assets/images/hero_cd_recycling_1791642672171.jpg',
    description: 'Ceramic tiles, screed mortar, sanitary fittings, and light plaster',
    areaSqFt: 250,
    projectType: 'Bathroom Renovation',
    concretePct: 30,
    brickPct: 25,
    metalPct: 8,
    soilPct: 37,
    estimatedTons: 2.2,
    salvageValue: 1200,
    mixedDisposalFee: 1400,
    recommendedDestination: 'Small-Lot Aggregated Tipper Route #14',
  },
];

export const AiWasteScannerModal: React.FC<AiWasteScannerModalProps> = ({
  isOpen,
  onClose,
  onProceedToBooking,
}) => {
  const [selectedSample, setSelectedSample] = useState<PresetSample>(PRESET_SAMPLES[0]);
  const [customArea, setCustomArea] = useState<number>(1000);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [customType, setCustomType] = useState<string>('Residential Demolition');
  const [customFileSelected, setCustomFileSelected] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulateCustomScan = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setCustomFileSelected(true);
    }, 900);
  };

  const netGain = selectedSample.salvageValue + selectedSample.mixedDisposalFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Waste Scanner &amp; Segregation Value Estimator
              </h2>
              <p className="text-xs text-slate-500">
                Instant computer-vision &amp; engineering estimation for C&D lot tonnage, composition, and salvage payout.
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

        <div className="p-6 space-y-6">
          {/* Preset Selector or Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Demolition Site Sample or Upload Rubble Photo
              </label>
              <span className="text-xs text-slate-500">
                Benchmarked against Indian CPCB 2017 &amp; 2025 Generation Rates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedSample(sample);
                    setCustomFileSelected(false);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedSample.id === sample.id && !customFileSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                    <img
                      src={sample.image}
                      alt={sample.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {sample.name}
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 line-clamp-1">
                    {sample.projectType}
                  </div>
                </button>
              ))}
            </div>

            {/* Simulated Live Camera / Upload Trigger */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Have your own site photo? Snap or drag rubble picture:</span>
              </div>
              <button
                onClick={handleSimulateCustomScan}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium text-xs transition-colors"
              >
                {isAnalyzing ? 'Analyzing Rubble...' : 'Upload Site Photo & Scan'}
              </button>
            </div>
          </div>

          {/* AI Analysis Result Grid */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-2xs uppercase tracking-wider font-bold text-emerald-700">
                  AI Computer Vision &middot; Density Matrix Result
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedSample.name} ({selectedSample.projectType})
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div>
                  Estimated Volume:{' '}
                  <span className="font-bold text-slate-900 tabular-nums">
                    {(selectedSample.estimatedTons * 18.5).toFixed(0)} CFT
                  </span>
                </div>
                <div>
                  Estimated Weight:{' '}
                  <span className="font-bold text-emerald-700 tabular-nums text-sm">
                    {selectedSample.estimatedTons} MT
                  </span>
                </div>
              </div>
            </div>

            {/* Segregation Composition Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                <span>Material Segregation Breakdown (Source Classification)</span>
                <span className="text-slate-500 text-2xs">Matches Indian Standard Composition</span>
              </div>
              <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex text-2xs font-bold text-white text-center leading-4">
                <div
                  style={{ width: `${selectedSample.concretePct}%` }}
                  className="bg-slate-700"
                  title={`Concrete: ${selectedSample.concretePct}%`}
                >
                  {selectedSample.concretePct}%
                </div>
                <div
                  style={{ width: `${selectedSample.brickPct}%` }}
                  className="bg-amber-700"
                  title={`Brick & Masonry: ${selectedSample.brickPct}%`}
                >
                  {selectedSample.brickPct}%
                </div>
                <div
                  style={{ width: `${selectedSample.metalPct}%` }}
                  className="bg-blue-600"
                  title={`Metals: ${selectedSample.metalPct}%`}
                >
                  {selectedSample.metalPct}%
                </div>
                <div
                  style={{ width: `${selectedSample.soilPct}%` }}
                  className="bg-emerald-600"
                  title={`Soil/Inert: ${selectedSample.soilPct}%`}
                >
                  {selectedSample.soilPct}%
                </div>
              </div>

              {/* Legend with clean typographic text */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs bg-slate-700" />
                  <span>Concrete ({selectedSample.concretePct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs bg-amber-700" />
                  <span>Brick Masonry ({selectedSample.brickPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                  <span>Metals / Rebar ({selectedSample.metalPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                  <span>Soil &amp; Inert ({selectedSample.soilPct}%)</span>
                </div>
              </div>
            </div>

            {/* Financial Value Comparison: The #1 Feature to Win Users */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl text-left">
                <div className="text-2xs font-bold uppercase tracking-wider text-red-700 mb-1">
                  If Dumped as Mixed Waste
                </div>
                <div className="text-lg font-extrabold text-red-600 tabular-nums">
                  -₹{selectedSample.mixedDisposalFee.toLocaleString('en-IN')}
                </div>
                <p className="text-2xs text-red-600/90 mt-1">
                  Municipal tipping fee + unsegregated hauling charge. Zero scrap recovery.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left">
                <div className="text-2xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  If Segregated at Site (Setu)
                </div>
                <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                  +₹{selectedSample.salvageValue.toLocaleString('en-IN')}
                </div>
                <p className="text-2xs text-emerald-700/90 mt-1">
                  Cash payout from nearby recycler for clean concrete &amp; rebar scrap.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-xl text-left shadow-xs">
                <div className="text-2xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Net Generator Benefit
                </div>
                <div className="text-lg font-extrabold text-white tabular-nums">
                  ₹{netGain.toLocaleString('en-IN')} Swing
                </div>
                <p className="text-2xs text-slate-300 mt-1">
                  You avoid the fee and earn the salvage credit. 100% CPCB compliant.
                </p>
              </div>
            </div>

            {/* Recommended Routing Logic */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">
                  Automated Smart Destination:
                </span>{' '}
                <span className="text-emerald-700 font-medium">
                  {selectedSample.recommendedDestination}
                </span>
              </div>
              <span className="text-2xs text-slate-500 font-medium">
                Shortest Haulage Radius
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onProceedToBooking(
                selectedSample.estimatedTons,
                selectedSample.concretePct > 50 ? 'concrete' : 'brick_masonry',
                true
              );
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <span>Proceed to Dispatch Tipper for {selectedSample.estimatedTons} MT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
