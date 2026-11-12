import { useState } from 'react';
import { Package, Phone } from 'lucide-react';
import { api } from '../api';
import { useSession } from '../lib/session';
import { ORDER_STATUS_LABELS, inr, num, timeAgo } from '../lib/format';
import type { Order } from '../types';
import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader, useLoad, useToast } from '../components/ui';

const tone = (s: Order['status']) => (s === 'delivered' ? 'green' : s === 'accepted' ? 'blue' : s === 'requested' ? 'amber' : ('slate' as const));

export function OrdersView() {
  const { user } = useSession();
  // Recyclers mainly sell, so open on the orders they need to act on.
  const [scope, setScope] = useState<'bought' | 'sold'>(user?.role === 'recycler' ? 'sold' : 'bought');
  const list = useLoad(() => api.get<Order[]>(`/orders?scope=${scope}`), [scope]);
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (o: Order, action: string, msg: string) => {
    setBusy(o.id + action);
    try {
      const updated = await api.patch<Order>(`/orders/${o.id}`, { action });
      list.setData(list.data!.map((x) => (x.id === o.id ? updated : x)));
      toast(msg);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Orders" subtitle="Material you have ordered, and orders other people have placed on your listings." />
      <div className="inline-flex p-1 bg-slate-100 rounded-lg mb-5">
        {(['bought', 'sold'] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${scope === s ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            {s === 'bought' ? 'I ordered' : 'Orders on my listings'}
          </button>
        ))}
      </div>

      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : !list.data!.length ? (
        <Empty icon={<Package className="w-5 h-5" />} title="No orders yet">
          {scope === 'bought' ? 'Browse the exchange to order recycled material.' : 'When someone orders from your listings it appears here.'}
        </Empty>
      ) : (
        <div className="space-y-3">
          {list.data!.map((o) => {
            const other = scope === 'bought' ? { label: 'Seller', name: o.seller_company || o.seller_name, phone: o.seller_phone } : { label: 'Buyer', name: o.buyer_company || o.buyer_name, phone: o.buyer_phone };
            const showPhone = o.status === 'accepted' || o.status === 'delivered' || scope === 'sold';
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{o.listing_title}</h3>
                      <Badge tone={tone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {num(o.quantity, 2)} {o.unit} · deliver to {o.delivery_site} · {timeAgo(o.created_at)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {other.label}: <b>{other.name}</b>
                      {showPhone && other.phone && (
                        <a href={`tel:${other.phone}`} className="ml-2 text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {other.phone}
                        </a>
                      )}
                    </div>
                    {o.note && <p className="text-sm text-slate-500 italic mt-1">“{o.note}”</p>}
                  </div>
                  <div className="text-right text-sm">
                    <div>Material {inr(o.material_cost)}</div>
                    {o.freight_cost > 0 && <div className="text-slate-500">Freight {inr(o.freight_cost)}</div>}
                    <div className="font-bold">{inr(o.material_cost + o.freight_cost)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {scope === 'sold' && o.status === 'requested' && (
                    <>
                      <Button size="sm" busy={busy === o.id + 'accept'} onClick={() => act(o, 'accept', 'Order accepted; stock reduced.')}>Accept</Button>
                      <Button size="sm" variant="danger" busy={busy === o.id + 'reject'} onClick={() => act(o, 'reject', 'Order declined.')}>Decline</Button>
                    </>
                  )}
                  {scope === 'sold' && o.status === 'accepted' && (
                    <Button size="sm" busy={busy === o.id + 'deliver'} onClick={() => act(o, 'deliver', 'Marked delivered. +30 points to you and the buyer.')}>Mark delivered</Button>
                  )}
                  {scope === 'bought' && o.status === 'requested' && (
                    <Button size="sm" variant="danger" busy={busy === o.id + 'cancel'} onClick={() => act(o, 'cancel', 'Order cancelled.')}>Cancel order</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
