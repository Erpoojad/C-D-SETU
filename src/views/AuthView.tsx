import React, { useState } from 'react';
import { api } from '../api';
import { navigate, useRoute, useSession } from '../lib/session';
import { ROLE_HINTS, ROLE_LABELS } from '../lib/format';
import type { User, UserRole } from '../types';
import { Button, Card, Field, Input } from '../components/ui';

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export function AuthView({ mode }: { mode: 'login' | 'signup' }) {
  const { setUser } = useSession();
  const next = useRoute().query.get('next');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'generator' as UserRole,
    city: '',
    company: '',
    invite_code: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const { user } = await api.post<{ user: User }>(`/auth/${mode}`, body);
      setUser(user);
      navigate(next && next.startsWith('/') ? next : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <a href={`#/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-emerald-700 font-semibold hover:underline">
                Create an account
              </a>
            </>
          ) : (
            <>
              Already registered?{' '}
              <a href={`#/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-emerald-700 font-semibold hover:underline">
                Sign in
              </a>
            </>
          )}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <fieldset>
                <legend className="text-xs font-bold text-slate-700 mb-2">I am a…</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        form.role === r ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" name="role" className="sr-only" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} />
                      <span className="block text-sm font-bold text-slate-900">{ROLE_LABELS[r]}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{ROLE_HINTS[r]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <Input required value={form.name} onChange={set('name')} autoComplete="name" />
                </Field>
                <Field label="City">
                  <Input required value={form.city} onChange={set('city')} placeholder="e.g. Nashik" />
                </Field>
                <Field label="Phone" hint="Shared only with people you transact with">
                  <Input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" />
                </Field>
                <Field label="Company / organisation (optional)">
                  <Input value={form.company} onChange={set('company')} autoComplete="organization" />
                </Field>
                {form.role === 'authority' && (
                  <Field label="Authority invite code" hint="Issued by the platform admin to verified ULB officers" className="sm:col-span-2">
                    <Input required value={form.invite_code} onChange={set('invite_code')} autoComplete="off" />
                  </Field>
                )}
              </div>
            </>
          )}
          <Field label="Email">
            <Input required type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </Field>
          <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters' : undefined}>
            <Input
              required
              type="password"
              minLength={mode === 'signup' ? 8 : undefined}
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </Field>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <Button type="submit" busy={busy} className="w-full">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
