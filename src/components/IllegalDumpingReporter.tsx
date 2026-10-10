import React, { useState } from 'react';
import { IllegalDumpingReport } from '../types';
import { AlertCircle, Camera, MapPin, CheckCircle2, ShieldAlert, Clock, ArrowRight, Eye, Send } from 'lucide-react';

interface IllegalDumpingReporterProps {
  reports: IllegalDumpingReport[];
  onAddReport: (report: IllegalDumpingReport) => void;
}

export const IllegalDumpingReporter: React.FC<IllegalDumpingReporterProps> = ({
  reports,
  onAddReport,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [location, setLocation] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [wardNumber, setWardNumber] = useState<string>('Ward 150 (Bellandur)');
  const [estimatedTonnage, setEstimatedTonnage] = useState<string>('3-5 MT (Tractor/407 Load)');
  const [remarks, setRemarks] = useState<string>('');
  const [photoAdded, setPhotoAdded] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newReport: IllegalDumpingReport = {
        id: `dump-${Date.now().toString().slice(-4)}`,
        reporterName: 'Concerned Resident / Site Monitor',
        location,
        landmark: landmark || 'Road shoulder near storm water drain',
        wardNumber,
        city: 'Bengaluru',
        timestamp: 'Just now',
        estimatedTonnage,
        status: 'Reported',
        imagePlaceholder: '/src/assets/images/hero_cd_recycling_1791642672171.jpg',
        remarks: remarks || 'Dumped illegally at night. GPS geotagged for municipal clearance.',
      };

      onAddReport(newReport);
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      setLocation('');
      setLandmark('');
      setRemarks('');
      setPhotoAdded(false);
      setTimeout(() => setSubmissionSuccess(false), 5000);
    }, 700);
  };

  return (
    <section id="citizen-vigilance" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <span>Swachh Setu Vigilance</span>
            <span aria-hidden="true">&middot;</span>
            <span>Zero-Tolerance for Roadside Dumping</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Citizen Grievance &amp; Illegal Dumping Incident Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Contractors dumping debris on storm drains or vacant plots face immediate ULB geo-notice. Citizens snap and geotag incidents; municipal clean-up tippers are routed with automated tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Instant Report Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Report Unauthorized Malba Dumping</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Takes 30 seconds. Tagged to the respective Municipal Ward Health Officer.
              </p>
            </div>

            {submissionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Report registered with Municipal Grievance Cell! Inspection team assigned.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Location / Street Name *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ring Road service lane near culvert"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nearby Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Behind Metro Pillar #214"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Municipal Ward
                  </label>
                  <select
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ward 150 (Bellandur)">Ward 150 (Bellandur)</option>
                    <option value="Ward 84 (Indiranagar)">Ward 84 (Indiranagar)</option>
                    <option value="Ward 12 (Noida Sec 76)">Ward 12 (Noida Sec 76)</option>
                    <option value="Ward 45 (Bandra West)">Ward 45 (Bandra West)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Estimated Debris Size
                  </label>
                  <select
                    value={estimatedTonnage}
                    onChange={(e) => setEstimatedTonnage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1-2 MT (Tractor Trolley)">1-2 MT (Tractor Trolley)</option>
                    <option value="3-5 MT (Tata 407)">3-5 MT (Tata 407)</option>
                    <option value="8-12 MT (Large Tipper)">8-12 MT (Large Tipper)</option>
                    <option value="20+ MT (Massive Dump)">20+ MT (Massive Dump)</option>
                  </select>
                </div>
              </div>

              {/* Photo Simulation */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Incident Photo with Geo-Coordinates
                </label>
                <div
                  onClick={() => setPhotoAdded(!photoAdded)}
                  className={`p-3 border-2 border-dashed rounded-xl cursor-pointer text-center transition-colors ${
                    photoAdded
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                >
                  <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="font-medium text-slate-600 block">
                    {photoAdded ? 'Photo Geotagged (12.9279° N, 77.6271° E)' : 'Click to attach photo or use camera'}
                  </span>
                  <span className="text-3xs text-slate-400">
                    Auto-captures location metadata
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Additional Details / Vehicle Plate if seen
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Unregistered yellow tractor spotted dumping at 11:30 PM..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Logging Geotag...' : 'Submit Incident to Municipal Cell'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Live Incident Resolution Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Live City Incident Log &amp; Enforcement Actions
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                Active Ward Clean-Up Teams
              </span>
            </div>

            <div className="space-y-3">
              {reports.map((report) => {
                const statusStyles: Record<
                  IllegalDumpingReport['status'],
                  { bg: string; text: string; label: string }
                > = {
                  Reported: { bg: 'bg-red-50', text: 'text-red-700', label: 'Reported & Pending' },
                  'Inspected by ULB': {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    label: 'Under Inspection',
                  },
                  'Vehicle Dispatched': {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    label: 'Recovery Tipper En Route',
                  },
                  'Cleared & Restored': {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    label: 'Cleared & Diverted',
                  },
                };

                const currentStyle = statusStyles[report.status];

                return (
                  <div
                    key={report.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{report.location}</span>
                        <span aria-hidden="true" className="text-slate-300">&middot;</span>
                        <span className="text-slate-500">{report.wardNumber}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-md text-2xs font-bold ${currentStyle.bg} ${currentStyle.text}`}>
                        {currentStyle.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{report.remarks}</p>

                    <div className="flex flex-wrap items-center justify-between text-2xs text-slate-400 pt-2 border-t border-slate-100">
                      <div>
                        Reported: <strong className="text-slate-600">{report.timestamp}</strong> by{' '}
                        <span>{report.reporterName}</span>
                      </div>
                      <div className="text-emerald-700 font-semibold tabular-nums">
                        Volume: {report.estimatedTonnage}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
