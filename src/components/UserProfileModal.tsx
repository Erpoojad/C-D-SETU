import React, { useState } from 'react';
import { UserProfile, UserBadge } from '../types';
import { CITY_LEADERBOARD } from '../data/mockData';
import { X, Award, ShieldCheck, Sparkles, TrendingUp, History, AlertTriangle, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'reputation' | 'badges' | 'leaderboard'>('history');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* User Card Header */}
        <div className="p-6 bg-slate-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-emerald-400/30">
                {currentUser.avatar}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-2xs font-semibold">
                    {currentUser.reputationLevel}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {currentUser.companyOrAffiliation} &middot; {currentUser.city}
                </div>
                <div className="text-2xs text-slate-500 font-mono">{currentUser.phone}</div>
              </div>
            </div>

            {/* Quick Switcher dropdown for evaluation */}
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs flex items-center gap-2">
              <span className="text-slate-400 text-2xs">Profile:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = allUsers.find((u) => u.id === e.target.value);
                  if (target) onSwitchUser(target);
                }}
                className="bg-slate-800 text-white font-medium text-xs rounded-md px-2 py-1 border-0 focus:ring-1 focus:ring-emerald-500"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-left">
            <div>
              <span className="text-2xs text-slate-400 block uppercase tracking-wider font-semibold">
                Green Reputation
              </span>
              <div className="text-xl font-extrabold text-emerald-400 tabular-nums">
                {currentUser.reputationPoints} pts
              </div>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block uppercase tracking-wider font-semibold">
                Diverted from Landfill
              </span>
              <div className="text-xl font-extrabold text-white tabular-nums">
                {currentUser.totalDivertedMT} MT
              </div>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block uppercase tracking-wider font-semibold">
                CO₂ Emissions Avoided
              </span>
              <div className="text-xl font-extrabold text-emerald-300 tabular-nums">
                {currentUser.co2SavedKg} kg
              </div>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block uppercase tracking-wider font-semibold">
                Verified Transactions
              </span>
              <div className="text-xl font-extrabold text-white tabular-nums">
                {currentUser.totalTransactions} Jobs
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'history', label: 'Disposal & Order History' },
            { id: 'reputation', label: 'Reputation Audit' },
            { id: 'badges', label: 'Badges Earned' },
            { id: 'leaderboard', label: 'City Leaderboard' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Tabs */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Verified Waste History</span>
                <span className="text-2xs text-slate-400">CPCB Rule 7(3) Audited</span>
              </div>

              {currentUser.history.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No previous disposal entries recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUser.history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-2xs text-slate-500 flex items-center gap-2">
                          <span>{item.date}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span>Target: {item.destinationOrSource}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-2xs">
                          <span className="text-emerald-700 font-semibold block">
                            &darr; {item.co2SavedKg} kg CO₂
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-2xs font-bold ${
                            item.status === 'Disposal complete'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'En route'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-4 text-xs">
              {/* How Reputation Points Work */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1.5">
                <span className="font-bold block">How C&amp;D Setu Reputation Points Work:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-emerald-900">
                  <div>&bull; +50 pts: Verified source segregation</div>
                  <div>&bull; +40 pts: Direct site-to-site reuse (&lt;5 km)</div>
                  <div>&bull; +30 pts: Small-lot route aggregation</div>
                  <div className="text-red-700">&bull; -50 pts: Mixed debris penalty</div>
                  <div className="text-red-700">&bull; -100 pts: Roadside dumping report</div>
                  <div>&bull; +100 pts: Clean site inspection clearance</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Recent Points Log</span>
                {currentUser.reputationLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{log.title}</div>
                      <div className="text-2xs text-slate-500">{log.reason} &middot; {log.date}</div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs ${
                        log.type === 'gain' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {log.type === 'gain' ? '+' : ''}{log.pointsDelta} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {currentUser.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    badge.isUnlocked
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      badge.isUnlocked
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{badge.name}</span>
                      {badge.isUnlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-2xs text-slate-600 leading-snug">{badge.description}</p>
                    {badge.unlockedAt && (
                      <span className="text-3xs text-emerald-800 font-semibold block pt-0.5">
                        Unlocked {badge.unlockedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-semibold">
                <span>National Green Builders Leaderboard</span>
                <span className="text-2xs text-slate-500">Live Swachh Score</span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {CITY_LEADERBOARD.map((item) => (
                  <div
                    key={item.rank}
                    className={`p-3 flex items-center justify-between ${
                      item.name.includes(currentUser.name)
                        ? 'bg-emerald-50/80 font-semibold'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold ${
                          item.rank === 1
                            ? 'bg-amber-400 text-slate-900'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.rank}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-2xs text-slate-500">{item.city} &middot; {item.tons} MT Diverted</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-emerald-700 tabular-nums">
                        {item.points} pts
                      </div>
                      <span className="text-3xs text-slate-400">{item.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
