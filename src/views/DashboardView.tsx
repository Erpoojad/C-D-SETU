import { ArrowRight, Award, Camera, Factory, Leaf, MapPinned, Package, Scale, ShoppingCart, Truck } from 'lucide-react';
import { api } from '../api';
import { useSession } from '../lib/session';
import { PICKUP_STATUS_LABELS, ROLE_LABELS, inr, materialLabel, num, timeAgo } from '../lib/format';
import type { Pickup, Stats, UserRole } from '../types';
import { Badge, Card, PageHeader, useLoad } from '../components/ui';

const ACTIONS: Record<UserRole, { href: string; icon: any; title: string; body: string }[]> = {
  generator: [
    { href: '#/pickups?new=1', icon: Truck, title: 'Request a pickup', body: 'Get debris collected by a local transporter' },
    { href: '#/scanner', icon: Camera, title: 'Scan a heap', body: 'Estimate tonnage and value from a photo' },
    { href: '#/market?sell=1', icon: Package, title: 'Sell reusable material', body: 'List bricks, steel or aggregate' },
  ],
  buyer: [
    { href: '#/market', icon: ShoppingCart, title: 'Buy recycled material', body: 'Aggregates, bricks and steel near you' },
    { href: '#/orders', icon: Package, title: 'My orders', body: 'Track what you have ordered' },
    { href: '#/facilities', icon: Factory, title: 'Find a plant', body: 'Recyclers in your city' },
  ],
  transporter: [
    { href: '#/pickups', icon: Truck, title: 'Find jobs', body: 'Open pickup requests in your city' },
    { href: '#/fleet', icon: Scale, title: 'My fleet', body: 'Add tippers and drivers' },
    { href: '#/facilities', icon: Factory, title: 'Drop-off points', body: 'Where loads can be delivered' },
  ],
  recycler: [
    { href: '#/facilities', icon: Factory, title: 'My facilities', body: 'Register your plant so loads are routed to you' },
    { href: '#/pickups', icon: Truck, title: 'Incoming loads', body: 'Pickups headed to your facilities' },
    { href: '#/market?sell=1', icon: Package, title: 'Sell recycled product', body: 'List aggregate with IS 383 test data' },
  ],
  authority: [
    { href: '#/reports', icon: MapPinned, title: 'Dumping reports', body: 'Inspect and clear reported hotspots' },
    { href: '#/pickups', icon: Truck, title: 'City pickups', body: 'Every manifested movement in your city' },
    { href: '#/facilities', icon: Factory, title: 'Facilities', body: 'Authorised processing sites' },
  ],
};

export function DashboardView() {
  const { user } = useSession();
  const u = user!;
  const stats = useLoad(() => api.get<Stats>('/stats'));
  const scope = u.role === 'authority' ? 'city' : u.role === 'recycler' ? 'facility' : 'mine';
  const pickups = useLoad(() => api.get<Pickup[]>(`/pickups?scope=${scope}`));
  const active = (pickups.data ?? []).filter((p) => !['completed', 'cancelled'].includes(p.status));
  const me = stats.data?.me;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title={`Namaste, ${u.name.split(' ')[0]}`} subtitle={`${ROLE_LABELS[u.role]} · ${u.city}${u.company ? ` · ${u.company}` : ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Scale className="w-4 h-4" /> Tonnes diverted</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{me ? num(me.tonnes) : '…'}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Leaf className="w-4 h-4" /> CO₂ avoided</div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">{me ? `${num(me.co2_kg, 0)} kg` : '…'}</div>
        </Card>
        <a href="#/profile" className="block">
          <Card className="p-5 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Award className="w-4 h-4" /> Green points</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1 tabular-nums">{num(me?.points ?? u.points, 0)}</div>
          </Card>
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {ACTIONS[u.role].map((a) => (
          <a key={a.href} href={a.href} className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition">
            <a.icon className="w-6 h-6 text-emerald-600" />
            <div className="font-bold text-slate-900 mt-3 flex items-center gap-1">
              {a.title} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="text-sm text-slate-500">{a.body}</div>
          </a>
        ))}
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-3">Active pickups</h2>
      {pickups.loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : active.length === 0 ? (
        <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">Nothing in progress right now.</div>
      ) : (
        <div className="space-y-2">
          {active.slice(0, 6).map((p) => (
            <a key={p.id} href="#/pickups" className="flex flex-wrap items-center justify-between gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300">
              <div>
                <div className="font-semibold text-slate-900 text-sm">{p.site_name}</div>
                <div className="text-xs text-slate-500">
                  {num(p.estimated_tons)} t {materialLabel(p.material)} · {timeAgo(p.created_at)} · est. salvage {inr(p.estimated_salvage_inr)}
                </div>
              </div>
              <Badge tone={p.status === 'requested' ? 'amber' : 'blue'}>{PICKUP_STATUS_LABELS[p.status]}</Badge>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
