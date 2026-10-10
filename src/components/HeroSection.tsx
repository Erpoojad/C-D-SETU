import React from 'react';
import { Camera, Search, ArrowRight, ShieldCheck, MapPin, Sparkles, Truck, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenBookingModal: () => void;
  onOpenScannerModal: () => void;
  onScrollToMarketplace: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBookingModal,
  onOpenScannerModal,
  onScrollToMarketplace,
}) => {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden">
      {/* Background Image with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_cd_recycling_1791642672171.jpg"
          alt="Modern C&D Waste Recycling Yard"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center brightness-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span>Smart India Hackathon 2026</span>
              <span aria-hidden="true">·</span>
              <span>Team REVINITY</span>
              <span aria-hidden="true">·</span>
              <span>Clean and Green</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              India&apos;s Unified Circular Exchange for Construction & Demolition Waste
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Connecting waste generators, nearby recyclers, and tipper fleets. Eliminating roadside dumping with proximity-based matching, IS 383:2016 quality certification, and instant CPCB digital compliance.
            </p>

            {/* Core USP Banner from SIH presentation */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm backdrop-blur-sm">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                Core Operating Principle
              </span>
              <div className="text-slate-100 font-medium flex flex-wrap items-center gap-2">
                <span>Right Material</span>
                <span className="text-emerald-400">→</span>
                <span>Right Destination</span>
                <span className="text-emerald-400">→</span>
                <span>Minimum Distance</span>
                <span className="text-emerald-400">→</span>
                <span className="text-emerald-300 font-semibold">Maximum Recovery</span>
              </div>
            </div>

            {/* Quick Action CTA Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenBookingModal}
                className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-colors shadow-md"
              >
                <Truck className="w-4 h-4" />
                <span>Book Tipper / Dispatch Malba</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenScannerModal}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>AI Rubble Scanner & Value Estimator</span>
              </button>

              <button
                onClick={onScrollToMarketplace}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Browse Recycled Materials</span>
              </button>
            </div>

            {/* Trust Markers without pills */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>IS 383:2016 Certified Aggregates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CPCB Form-I Digital QR Slips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Small Lot Aggregation (&lt;40% Freight)</span>
              </div>
            </div>
          </div>

          {/* Quick Problem vs Solution Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Why Past C&D Apps Struggled</span>
                  <span className="text-xs font-normal text-emerald-400">Setu Resolution</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  How C&D Setu removes operational friction for real Indian sites.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                    <span className="text-red-400">Past Issue:</span>
                    <span>High haulage cost over 20+ km</span>
                  </div>
                  <p className="text-slate-400">
                    <strong className="text-emerald-400">Setu Fix:</strong> Proximity matching (Direct Reuse &lt;5km) &amp; multi-site lot pooling for 45% freight reduction.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                    <span className="text-red-400">Past Issue:</span>
                    <span>Zero incentive for builders to segregate</span>
                  </div>
                  <p className="text-slate-400">
                    <strong className="text-emerald-400">Setu Fix:</strong> Segregated lots earn salvage cash-back (up to ₹750/MT payout vs ₹1,500 dumping fine).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                    <span className="text-red-400">Past Issue:</span>
                    <span>No trust in recycled material strength</span>
                  </div>
                  <p className="text-slate-400">
                    <strong className="text-emerald-400">Setu Fix:</strong> IS 383:2016 lab test sheets attached with verified AIV, Crushing, and Silt values.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Aligned with CPCB 2025 Rules</span>
                <span className="text-emerald-400 font-semibold">100% Traceable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width National C&D Impact Strip (from Page 2 of Presentation) */}
      <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
            National C&D Landscape &middot; Government of India Data (TIFAC / CPCB / CSE)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-left">
            <div>
              <div className="text-2xl font-extrabold text-white tabular-nums">150 MT</div>
              <div className="text-xs text-slate-400 mt-0.5">Generated Annually</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white tabular-nums">34+</div>
              <div className="text-xs text-slate-400 mt-0.5">Operational Plants</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white tabular-nums">16,000 TPD</div>
              <div className="text-xs text-slate-400 mt-0.5">Combined Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-400 tabular-nums">~4%</div>
              <div className="text-xs text-slate-400 mt-0.5">Current Recovery</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">&gt;90%</div>
              <div className="text-xs text-slate-400 mt-0.5">Potentially Reusable</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">40% &darr; CO₂</div>
              <div className="text-xs text-slate-400 mt-0.5">With Recycled RCA</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
