import { useEffect, useState } from 'react';
import { Award, Menu, Recycle, X } from 'lucide-react';
import { navigate, useRoute, useSession } from './lib/session';
import type { UserRole } from './types';
import { Loading } from './components/ui';
import { CalculatorSection } from './components/CalculatorSection';
import { levelFor } from './views/ProfileView';
import { HomeView } from './views/HomeView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { MarketplaceView } from './views/MarketplaceView';
import { OrdersView } from './views/OrdersView';
import { PickupsView } from './views/PickupsView';
import { FleetView } from './views/FleetView';
import { FacilitiesView } from './views/FacilitiesView';
import { ReportsView } from './views/ReportsView';
import { ScannerView } from './views/ScannerView';
import { ProfileView } from './views/ProfileView';
import { ManifestView } from './views/ManifestView';

interface NavItem {
  path: string;
  label: string;
  roles?: UserRole[];
}

const SIGNED_IN_NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/pickups', label: 'Pickups' },
  { path: '/scanner', label: 'Scan heap', roles: ['generator', 'recycler'] },
  { path: '/fleet', label: 'Fleet', roles: ['transporter'] },
  { path: '/market', label: 'Marketplace' },
  { path: '/orders', label: 'Orders', roles: ['generator', 'buyer', 'recycler', 'transporter'] },
  { path: '/facilities', label: 'Facilities' },
  { path: '/reports', label: 'Dumping reports' },
];

const PUBLIC_NAV: NavItem[] = [
  { path: '/market', label: 'Marketplace' },
  { path: '/facilities', label: 'Facilities' },
  { path: '/calculator', label: 'Calculator' },
  { path: '/manifest', label: 'Verify manifest' },
];

/** Pages that need an account. Everything else is public. */
const PROTECTED = new Set(['dashboard', 'pickups', 'scanner', 'fleet', 'orders', 'reports', 'profile']);
const ROLE_ONLY: Record<string, UserRole[]> = { fleet: ['transporter'] };

export default function App() {
  const { user, ready } = useSession();
  const route = useRoute();
  const page = route.parts[0] ?? '';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [route.path]);

  // Signed-out visitors to a private page go to sign-in, then come back here.
  useEffect(() => {
    if (!ready) return;
    if (!user && PROTECTED.has(page)) {
      navigate('/login', { next: window.location.hash.replace(/^#/, '') });
    } else if (user && (page === 'login' || page === 'signup')) {
      navigate(route.query.get('next') || '/dashboard');
    } else if (user && page === '') {
      navigate('/dashboard');
    }
  }, [ready, user, page]);

  const nav = user ? SIGNED_IN_NAV.filter((n) => !n.roles || n.roles.includes(user.role)) : PUBLIC_NAV;
  const isActive = (p: string) => route.path === p || route.path.startsWith(`${p}/`);

  let content: React.ReactNode;
  if (!ready || (!user && PROTECTED.has(page))) {
    content = <Loading />;
  } else if (user && ROLE_ONLY[page] && !ROLE_ONLY[page].includes(user.role)) {
    content = <NotFound text="This page is for transporter accounts." />;
  } else {
    switch (page) {
      case '':
        content = <HomeView />;
        break;
      case 'login':
        content = <AuthView mode="login" />;
        break;
      case 'signup':
        content = <AuthView mode="signup" />;
        break;
      case 'dashboard':
        content = <DashboardView />;
        break;
      case 'pickups':
        content = <PickupsView />;
        break;
      case 'scanner':
        content = <ScannerView />;
        break;
      case 'fleet':
        content = <FleetView />;
        break;
      case 'market':
        content = <MarketplaceView />;
        break;
      case 'orders':
        content = <OrdersView />;
        break;
      case 'facilities':
        content = <FacilitiesView />;
        break;
      case 'reports':
        content = <ReportsView />;
        break;
      case 'profile':
        content = <ProfileView />;
        break;
      case 'manifest':
        content = <ManifestView no={route.parts[1]} />;
        break;
      case 'calculator':
        content = <CalculatorSection onOpenBookingModal={(t) => navigate('/pickups', { new: 1, tons: t })} />;
        break;
      default:
        content = <NotFound text="This page does not exist." />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href={user ? '#/dashboard' : '#/'} className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Recycle className="w-5 h-5" /></span>
            <span className="font-extrabold text-slate-900 tracking-tight">C&amp;D Setu</span>
          </a>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {nav.map((n) => (
              <a
                key={n.path}
                href={`#${n.path}`}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${isActive(n.path) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <a href="#/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-800 max-w-[10rem] truncate">{user.name.split(' ')[0]}</span>
                <span className="text-xs text-slate-500 tabular-nums">{user.points} · {levelFor(user.points).name}</span>
              </a>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <a href="#/login" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">Sign in</a>
                <a href="#/signup" className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Create account</a>
              </div>
            )}
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 grid gap-1" aria-label="Mobile">
            {nav.map((n) => (
              <a key={n.path} href={`#${n.path}`} className={`px-3 py-2.5 rounded-lg text-sm font-semibold ${isActive(n.path) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'}`}>
                {n.label}
              </a>
            ))}
            {user ? (
              <a href="#/profile" className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700">Profile · {user.points} points</a>
            ) : (
              <>
                <a href="#/login" className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700">Sign in</a>
                <a href="#/signup" className="px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700">Create account</a>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">{content}</main>

      <footer className="border-t border-slate-200 bg-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>C&amp;D Setu · construction &amp; demolition waste exchange · aligned with the C&amp;D Waste Management Rules, 2016</span>
          <span className="flex gap-4">
            <a href="#/manifest" className="hover:text-slate-800">Verify a manifest</a>
            <a href="#/calculator" className="hover:text-slate-800">Waste calculator</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function NotFound({ text }: { text: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-700 font-semibold">{text}</p>
      <a href="#/" className="text-sm text-emerald-700 font-semibold hover:underline mt-2 inline-block">Go home</a>
    </div>
  );
}
