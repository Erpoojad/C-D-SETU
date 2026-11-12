import React, { useState } from 'react';
import { Award, LogOut, Trophy } from 'lucide-react';
import { api } from '../api';
import { useSession } from '../lib/session';
import { ROLE_LABELS, date, num } from '../lib/format';
import type { ReputationEvent, User, UserRole } from '../types';
import { Button, Card, Empty, Field, Input, Loading, PageHeader, useLoad, useToast } from '../components/ui';

/** Point thresholds for display levels. */
export function levelFor(points: number) {
  if (points >= 1000) return { name: 'Green Champion', next: null };
  if (points >= 500) return { name: 'Gold', next: 1000 };
  if (points >= 150) return { name: 'Silver', next: 500 };
  return { name: 'Bronze', next: 150 };
}

export function ProfileView() {
  const { user, setUser, logout } = useSession();
  const u = user!;
  const events = useLoad(() => api.get<ReputationEvent[]>('/me/events'));
  const board = useLoad(() => api.get<{ name: string; company: string; role: UserRole; city: string; points: number }[]>('/leaderboard'));
  const [f, setF] = useState({ name: u.name, phone: u.phone, city: u.city, company: u.company });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const level = levelFor(u.points);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser((await api.patch<{ user: User }>('/me', f)).user);
      toast('Profile saved.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Profile & green points"
        subtitle={`${ROLE_LABELS[u.role]} · ${u.email}`}
        action={<Button variant="secondary" onClick={logout}><LogOut className="w-4 h-4" /> Sign out</Button>}
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><Award className="w-4 h-4" /> Level</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{level.name}</div>
            <div className="text-sm text-slate-600">{num(u.points, 0)} points</div>
            {level.next && (
              <>
                <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, (u.points / level.next) * 100)}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{num(level.next - u.points, 0)} to next level</div>
              </>
            )}
            <p className="text-xs text-slate-500 mt-3">Points come only from verified actions: completed manifested pickups, delivered orders, listings and cleared dumping reports.</p>
          </Card>
          <Card className="p-5">
            <form onSubmit={save} className="space-y-3">
              <Field label="Name"><Input required value={f.name} onChange={set('name')} /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={set('phone')} type="tel" /></Field>
              <Field label="City"><Input required value={f.city} onChange={set('city')} /></Field>
              <Field label="Company / organisation"><Input value={f.company} onChange={set('company')} /></Field>
              <Button type="submit" busy={busy} className="w-full">Save profile</Button>
            </form>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-3">Points history</h2>
          {events.loading ? (
            <Loading />
          ) : !events.data?.length ? (
            <Empty title="No points yet">Complete a pickup, list material or report dumping to earn your first points.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {events.data.map((e) => (
                <li key={e.id} className="py-2.5 flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-500">{e.reason} · {date(e.created_at)}</div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${e.points >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {e.points >= 0 ? '+' : ''}{e.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Leaderboard</h2>
          {board.loading ? (
            <Loading />
          ) : !board.data?.length ? (
            <Empty title="Nobody has points yet">Be the first.</Empty>
          ) : (
            <ol className="space-y-2">
              {board.data.map((b, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-slate-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{b.company || b.name}</div>
                    <div className="text-xs text-slate-500">{ROLE_LABELS[b.role]} · {b.city}</div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{num(b.points, 0)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
