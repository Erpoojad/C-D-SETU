import React from 'react';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                C&D
              </div>
              <span className="font-extrabold text-white">
                Setu<span className="text-emerald-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Smart India Hackathon 2026 Innovation by Team REVINITY (PS SIH26195: Clean and Green).
              A unified platform enabling source segregation, GIS proximity routing, certified circular marketplace, and CPCB digital compliance.
            </p>
            <div className="text-2xs text-slate-400 font-medium pt-1">
              USP: Right Material &rarr; Right Destination &rarr; Minimum Distance &rarr; Maximum Recovery
            </div>
          </div>

          {/* Regulatory & Institutional Framework */}
          <div className="md:col-span-4 space-y-2">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-2xs">
              Statutory Guidelines &amp; Institutional Reports
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">&bull;</span>
                <span>CPCB &ndash; Construction &amp; Demolition Waste Management Rules 2016 / 2025</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">&bull;</span>
                <span>Bureau of Indian Standards &ndash; IS 383:2016 (Coarse &amp; Fine Aggregates)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">&bull;</span>
                <span>Centre for Science and Environment (CSE) &ndash; Rubble Recast Report</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">&bull;</span>
                <span>TIFAC &ndash; Estimation of Demolition Waste Generation Rates in India</span>
              </li>
            </ul>
          </div>

          {/* Academic & Circular Partners */}
          <div className="md:col-span-3 space-y-2">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-2xs">
              Platform Architecture
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>Source Segregation &amp; Vision Estimator</li>
              <li>GIS Proximity &amp; Smart Geo-Routing</li>
              <li>Small-Lot Tipper Route Aggregation</li>
              <li>Swachh Setu Citizen Vigilance &amp; Hotline</li>
              <li>NABL IS 383:2016 Quality Verification</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-2xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} C&amp;D Setu &middot; Team REVINITY (SIH 2026 Team ID 67).
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Clean and Green Theme</span>
            <span aria-hidden="true">&middot;</span>
            <span>Swachh Bharat Mission Urban 2.0</span>
            <span aria-hidden="true">&middot;</span>
            <span>Circular Economy in Construction</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
