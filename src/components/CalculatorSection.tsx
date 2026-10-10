import React, { useState } from 'react';
import { Calculator, Leaf, DollarSign, ArrowRight, BarChart3, Info } from 'lucide-react';

interface CalculatorSectionProps {
  onOpenBookingModal: (tons: number) => void;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({
  onOpenBookingModal,
}) => {
  const [areaSqFt, setAreaSqFt] = useState<number>(2400);
  const [projectType, setProjectType] = useState<'demolition' | 'renovation' | 'road'>('demolition');
  const [structureStyle, setStructureStyle] = useState<'rcc' | 'brick_loadbearing' | 'interior'>('rcc');

  // Benchmark metrics from CPCB & TIFAC:
  // Demolition generates ~50 kg / sq.ft for RCC, ~42 kg / sq.ft for brick
  // Renovation generates ~12 kg / sq.ft
  // Road pavement generates ~90 kg / sq.ft
  let genRateKgPerSqFt = 50;
  if (projectType === 'renovation') {
    genRateKgPerSqFt = 14;
  } else if (projectType === 'road') {
    genRateKgPerSqFt = 85;
  } else if (structureStyle === 'brick_loadbearing') {
    genRateKgPerSqFt = 44;
  }

  const totalTons = Math.round((areaSqFt * genRateKgPerSqFt) / 1000);

  // Exact composition according to Slide 6 (CPCB/TIFAC data):
  // 36% Soil, Sand & Gravel, 31% Brick & Masonry, 23% Concrete, 5% Metals, 2% Bitumen, 2% Wood, 1% Others
  const soilTons = +(totalTons * 0.36).toFixed(1);
  const brickTons = +(totalTons * 0.31).toFixed(1);
  const concreteTons = +(totalTons * 0.23).toFixed(1);
  const metalTons = +(totalTons * 0.05).toFixed(1);
  const otherTons = +(totalTons * 0.05).toFixed(1);

  // CO2 savings: Recycled aggregate saves ~40% CO2 vs quarry stone (~42 kg CO2 per ton of RCA) + recycled steel saves 1,600 kg CO2/ton
  const co2MitigatedKg = Math.round((concreteTons + brickTons) * 42 + metalTons * 1650);

  // Cost economics:
  // Salvage revenue from segregated sale:
  // Concrete: ₹680/T, Bricks: ₹5.5/brick or ₹520/T, Metals: ₹42,000/T, Soil: ₹180/T
  const salvageRevenue = Math.round(
    concreteTons * 680 + brickTons * 520 + metalTons * 42000 + soilTons * 180
  );
  // Traditional mixed dumping fees + transport: ₹950 per ton
  const traditionalDumpFee = Math.round(totalTons * 950);
  const netFinancialGain = salvageRevenue + traditionalDumpFee;

  return (
    <section id="calculator" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <span>CPCB &amp; TIFAC Benchmark Data</span>
            <span aria-hidden="true">&middot;</span>
            <span>Empirical Environmental Model</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            C&amp;D Waste Yield, Value &amp; Carbon Mitigation Calculator
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Input your project dimensions to calculate expected material tonnages based on Indian CPCB composition metrics, estimated scrap payout, and avoided CO₂ footprint.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                1. Project Activity Type
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'demolition', label: 'Full Demolition' },
                  { id: 'renovation', label: 'Interior Strip-Out' },
                  { id: 'road', label: 'Pavement / Civil' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setProjectType(item.id as any)}
                    className={`py-2 px-3 rounded-lg font-semibold transition-colors text-center ${
                      projectType === item.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                2. Structural Construction Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setStructureStyle('rcc')}
                  className={`py-2 px-3 rounded-lg font-semibold transition-colors text-left ${
                    structureStyle === 'rcc'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  RCC Framed Structure
                </button>
                <button
                  onClick={() => setStructureStyle('brick_loadbearing')}
                  className={`py-2 px-3 rounded-lg font-semibold transition-colors text-left ${
                    structureStyle === 'brick_loadbearing'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Load-Bearing Masonry
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Built-Up Area / Footprint</span>
                <span className="text-emerald-700 tabular-nums font-bold">
                  {areaSqFt.toLocaleString('en-IN')} sq. ft
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="20000"
                step="200"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-2xs text-slate-400 mt-1">
                <span>200 sq.ft (Room)</span>
                <span>5,000 sq.ft (Villa)</span>
                <span>20,000 sq.ft (Commercial)</span>
              </div>
            </div>

            {/* Quick Summary Pill-free text */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="text-slate-500 font-medium flex items-center justify-between">
                <span>Calculated Generation Rate:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {genRateKgPerSqFt} kg / sq.ft
                </span>
              </div>
              <div className="text-slate-500 font-medium flex items-center justify-between">
                <span>Estimated Rubble Volume:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  ~{(totalTons * 18.5).toFixed(0)} CFT
                </span>
              </div>
              <div className="text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Recommended Tipper Trips:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {Math.ceil(totalTons / 8.5)} trips (8 MT Tipper)
                </span>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700">
                  Total Estimated Generation
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {totalTons} Metric Tonnes (MT)
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700">
                  Net Economic Advantage
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  +₹{netFinancialGain.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Material Distribution Bars (Based exactly on Presentation slide 6) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Composition Breakdown (CPCB National Baseline)</span>
                <span className="text-2xs text-slate-500">Slide 6 Data Grounded</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-2xs font-medium text-slate-600 mb-0.5">
                    <span>Soil, Sand &amp; Gravel (36%)</span>
                    <span className="tabular-nums font-bold text-slate-800">{soilTons} MT</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '36%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-medium text-slate-600 mb-0.5">
                    <span>Brick &amp; Masonry (31%)</span>
                    <span className="tabular-nums font-bold text-slate-800">{brickTons} MT</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '31%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-medium text-slate-600 mb-0.5">
                    <span>Concrete (23%)</span>
                    <span className="tabular-nums font-bold text-slate-800">{concreteTons} MT</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-full rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-medium text-slate-600 mb-0.5">
                    <span>Demolition Steel &amp; Rebar Metals (5%)</span>
                    <span className="tabular-nums font-bold text-slate-800">{metalTons} MT</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-medium text-slate-600 mb-0.5">
                    <span>Bitumen, Wood &amp; Others (5%)</span>
                    <span className="tabular-nums font-bold text-slate-800">{otherTons} MT</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental & Carbon Impact Card */}
            <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Leaf className="w-4 h-4" />
                <span>Environmental Carbon Offset (Life Cycle Assessment)</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">CO₂ Avoided by Recycled Substitution:</span>
                <span className="text-xl font-extrabold text-emerald-400 tabular-nums">
                  {co2MitigatedKg.toLocaleString('en-IN')} kg CO₂
                </span>
              </div>
              <p className="text-2xs text-slate-300">
                Corresponds to ~40% carbon footprint reduction against virgin crushed granite and newly manufactured masonry blocks.
              </p>
            </div>

            {/* Action CTA */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onOpenBookingModal(totalTons)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                <span>Dispatch Tipper for this Calculated Load ({totalTons} MT)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
