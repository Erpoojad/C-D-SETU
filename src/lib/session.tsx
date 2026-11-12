import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import type { User } from '../types';

interface Session {
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<Session>(null as unknown as Session);
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      setUser((await api.get<{ user: User | null }>('/me')).user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    void refresh();
    // Points change when other people act (a transporter completes your pickup,
    // an officer clears your report), so re-read the account on every page change.
    const onNav = () => void refresh();
    window.addEventListener('hashchange', onNav);
    return () => window.removeEventListener('hashchange', onNav);
  }, []);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
    navigate('/');
  };

  return <Ctx.Provider value={{ user, ready, setUser, refresh, logout }}>{children}</Ctx.Provider>;
}

/* ------------------------------ hash routing ------------------------------ */

export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

function current(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const on = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const qs = query
    ? new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  window.location.hash = `#${path}${qs ? `?${qs}` : ''}`;
}
