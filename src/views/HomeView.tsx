import { ArrowRight, Camera, Factory, FileCheck2, Recycle, Truck } from 'lucide-react';
import { api } from '../api';
import { IMAGES } from '../assets/images';
import { num } from '../lib/format';
import type { Stats } from '../types';
import { useLoad } from '../components/ui';
import { CalculatorSection } from '../components/CalculatorSection';
import { navigate } from '../lib/session';

const STEPS = [
  { icon: Camera, title: 'Estimate', body: 'Snap the rubble heap or enter the plot area to get tonnage, material split and salvage value.' },
  { icon: Truck, title: 'Book a pickup', body: 'Local transporters see your request, quote a fee and are assigned with vehicle and driver details.' },
  { icon: Factory, title: 'Deliver to a recycler', body: 'Loads go to the nearest registered crusher or reuse site that accepts that material.' },
  { icon: FileCheck2, title: 'Get the manifest', body: 'Weighbridge weights produce a numbered manifest anyone can verify online.' },
];

export function HomeView() {
  const { data } = useLoad(() => api.get<Stats>('/stats'));
  const p = data?.platform;

  return (
    <>
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <img src={IMAGES.heroCdRecycling} alt="" className="absolute inset-0 w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Turn construction debris into material someone needs.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              C&amp;D Setu connects people with rubble to dispose of, the transporters who carry it, and the recyclers and builders who can
              use it, with manifests that meet the C&amp;D Waste Management Rules, 2016.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg"
              >
                Create a free account <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#/calculator" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg">
                Estimate my waste
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Tonnes diverted', p ? num(p.tonnes_diverted) : '…'],
            ['Pickups completed', p ? num(p.pickups_completed, 0) : '…'],
            ['Registered facilities', p ? num(p.facilities, 0) : '…'],
            ['Materials listed', p ? num(p.active_listings, 0) : '…'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Recycle className="w-6 h-6 text-emerald-600" /> How it works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="p-5 bg-white rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-400">STEP {i + 1}</span>
              </div>
              <div className="font-bold text-slate-900">{s.title}</div>
              <p className="text-sm text-slate-600 mt-1">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CalculatorSection onOpenBookingModal={(t) => navigate('/pickups', { new: 1, tons: t })} />
    </>
  );
}
