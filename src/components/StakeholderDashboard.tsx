import React from 'react';
import { UserRole, PickupRequest, ManifestDocument, MaterialListing } from '../types';
import { Truck, CheckCircle2, Clock, FileText, ArrowRight, ShieldCheck, AlertTriangle, Layers, Building2, MapPin } from 'lucide-react';

interface StakeholderDashboardProps {
  currentRole: UserRole;
  pickups: PickupRequest[];
  onOpenBookingModal: () => void;
  onOpenScannerModal: () => void;
  onOpenManifestModal: () => void;
  onTrackPickup: (pickup: PickupRequest) => void;
}

export const StakeholderDashboard: React.FC<StakeholderDashboardProps> = ({
  currentRole,
  pickups,
  onOpenBookingModal,
  onOpenScannerModal,
  onOpenManifestModal,
  onTrackPickup,
}) => {
  return (
    <section id="compliance-portal" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
              <span>Role-Specific Workspace</span>
              <span aria-hidden="true">&middot;</span>
              <span className="capitalize">{currentRole} Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Operational Console &middot;{' '}
              {currentRole === 'generator' && 'Waste Generator & Demolition Site'}
              {currentRole === 'buyer' && 'Infrastructure & Aggregate Procurement'}
              {currentRole === 'transporter' && 'Tipper Logistics Fleet Command'}
              {currentRole === 'recycler' && 'Resource Recovery Facility Intake'}
              {currentRole === 'authority' && 'CPCB & Urban Local Body (ULB) Vigilance'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Live tracking of dispatches, weighbridge verification slips, and statutory environmental compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenManifestModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>View Active CPCB Manifest</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content Based on Role */}
        {currentRole === 'generator' && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Active Dispatches
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {pickups.length} Lots
                </div>
                <span className="text-2xs text-emerald-700 font-medium mt-1 block">
                  &check; 100% Geo-Tracked
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Total Salvage Cash-Back
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                  ₹8,350
                </div>
                <span className="text-2xs text-slate-500 mt-1 block">
                  Net earnings from segregated rubble
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Diverted from Landfills
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  13.7 MT
                </div>
                <span className="text-2xs text-slate-500 mt-1 block">
                  Passed to authorized recyclers
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  Compliance Status
                </span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5 text-base">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Rule 7(3) Clear</span>
                </div>
                <span className="text-2xs text-slate-500 mt-1 block">
                  Ready for Building Completion
                </span>
              </div>
            </div>

            {/* Active Requests Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Live Malba Lots &amp; Assigned Tipper Fleet
                </h3>
                <span className="text-xs text-slate-500 tabular-nums">Real-time status</span>
              </div>

              <div className="divide-y divide-slate-100 overflow-x-auto">
                {pickups.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{req.siteName}</span>
                        <span aria-hidden="true" className="text-slate-300">&middot;</span>
                        <span className="text-slate-500">{req.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-2xs text-slate-600">
                        <span>
                          Carrier: <strong>{req.assignedVehicle || 'Pending Assignment'}</strong>
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span>
                          Weight: <strong className="tabular-nums">{req.estimatedTons} MT</strong> (
                          {req.isSegregated ? 'Segregated' : 'Mixed'})
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="text-emerald-700 font-medium">
                          Target: {req.destinationPlant}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-2xs text-slate-400 block">Net Payout</span>
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            req.netPayout >= 0 ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {req.netPayout >= 0 ? '+' : '-'}₹{Math.abs(req.netPayout).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-md text-xs font-semibold ${
                          req.status === 'En route'
                            ? 'bg-blue-50 text-blue-700'
                            : req.status === 'Picked up'
                            ? 'bg-amber-50 text-amber-700'
                            : req.status === 'Scheduled'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {req.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onTrackPickup(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </button>

                        <button
                          onClick={onOpenManifestModal}
                          className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                        >
                          Manifest QR
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentRole === 'buyer' && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Procurement &amp; Batch Quality Testing Portal
            </h3>
            <p className="text-xs text-slate-600">
              Contractors purchasing recycled aggregates enjoy priority delivery matching their site batching plant. All consignments include NABL test certificate according to IS 383:2016.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Active Orders</span>
                <div className="text-xl font-bold text-slate-900 mt-1">2 Bulk Shipments</div>
                <span className="text-2xs text-emerald-700 font-medium">450 MT RCA 20mm in transit</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Procurement Savings</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">₹2,56,000</div>
                <span className="text-2xs text-slate-500">46% saved vs natural quarry stone</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Green Building Credits</span>
                <div className="text-xl font-bold text-slate-900 mt-1">4.5 IGBC Points</div>
                <span className="text-2xs text-emerald-700 font-medium">MR Credit 2 &middot; Recycled Content</span>
              </div>
            </div>
          </div>
        )}

        {currentRole === 'transporter' && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Driver &amp; Fleet Logistics Command
            </h3>
            <p className="text-xs text-slate-600">
              Small-lot aggregation algorithm groups 2-3 nearby pickups into single runs, eliminating dead miles and increasing driver daily revenue by 38%.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Daily Trips Completed</span>
                <div className="text-xl font-bold text-slate-900 mt-1">4 Trips</div>
                <span className="text-2xs text-emerald-700 font-medium">Zero dead mileage recorded</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Today&apos;s Fleet Earnings</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">₹9,450</div>
                <span className="text-2xs text-slate-500">Direct digital bank settlement</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Weighbridge Slips</span>
                <div className="text-xl font-bold text-slate-900 mt-1">Auto-Synced</div>
                <span className="text-2xs text-emerald-700 font-medium">Zero physical paperwork delay</span>
              </div>
            </div>
          </div>
        )}

        {currentRole === 'recycler' && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Processing Plant Intake &amp; Stockpile Inventory
            </h3>
            <p className="text-xs text-slate-600">
              Plants can forecast raw rubble arrivals in real-time, plan crushing campaigns, and list graded aggregates on the marketplace before the shift ends.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Today&apos;s Intake</span>
                <div className="text-xl font-bold text-slate-900 mt-1">1,480 MT / 2,000 TPD</div>
                <span className="text-2xs text-emerald-700 font-medium">74% capacity utilization</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Crushed RCA Stockpile</span>
                <div className="text-xl font-bold text-slate-900 mt-1">680 MT Available</div>
                <span className="text-2xs text-emerald-700 font-medium">IS 383 Grade II certified</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Pending Marketplace Inquiries</span>
                <div className="text-xl font-bold text-slate-900 mt-1">6 Orders</div>
                <span className="text-2xs text-slate-500">Dispatch slots assigned</span>
              </div>
            </div>
          </div>
        )}

        {currentRole === 'authority' && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Urban Local Body (ULB) &amp; CPCB Compliance Console
            </h3>
            <p className="text-xs text-slate-600">
              City-level live monitoring of landfill diversion, enforcement against illegal roadside dumping hotspots, and Swachh Survekshan scoring.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Citywide Diversion</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">88.4%</div>
                <span className="text-2xs text-slate-500">Up from 4% national baseline</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Ward Grievances</span>
                <div className="text-xl font-bold text-slate-900 mt-1">94% Resolved</div>
                <span className="text-2xs text-emerald-700 font-medium">&lt;4 hour response time</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">Digital Manifests</span>
                <div className="text-xl font-bold text-slate-900 mt-1">1,824 Issued</div>
                <span className="text-2xs text-slate-500">Zero unmanifested tippers</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-2xs text-slate-500 uppercase font-bold">CO₂ Mitigation</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">42,800 MT</div>
                <span className="text-2xs text-emerald-700 font-medium">Carbon credit verified</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
