import React from 'react';
import { UserRole } from '../types';
import { Truck, ShieldCheck, ArrowRight, UserCheck, Layers } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenBookingModal: () => void;
  onOpenScannerModal: () => void;
  onOpenProfileModal: () => void;
  userPoints: number;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  onOpenBookingModal,
  onOpenScannerModal,
  onOpenProfileModal,
  userPoints,
  userName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-emerald-700 transition-colors">
              C&D
            </div>
            <span className="font-extrabold text-slate-900">
              Setu<span className="text-emerald-600">.</span>
            </span>
          </a>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#marketplace"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Exchange
            </a>
            <a
              href="#decentralized-network"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 text-emerald-700 font-semibold"
            >
              Small-City GIS Network
            </a>
            <a
              href="#smart-routing"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Smart Routing
            </a>
            <a
              href="#calculator"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Value Calculator
            </a>
            <a
              href="#citizen-vigilance"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Vigilance
            </a>
          </nav>

          {/* Zone 3: 1 primary action with role & profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* User Profile & Green Points Pill-free trigger */}
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800"
              title="View your profile, waste history & reputation points"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-2xs">
                {userName.charAt(0)}
              </div>
              <span className="hidden sm:inline font-bold text-slate-900">{userName.split(' ')[0]}</span>
              <span className="text-emerald-700 font-extrabold tabular-nums bg-emerald-100/80 px-1.5 py-0.5 rounded-md text-2xs">
                {userPoints} pts
              </span>
            </button>

            <button
              onClick={onOpenBookingModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <Truck className="w-4 h-4" />
              <span>Book Tipper</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
