import React from 'react';
import { ManifestDocument } from '../types';
import { X, Printer, ShieldCheck, QrCode, Download, CheckCircle, FileCheck, Building } from 'lucide-react';

interface ComplianceManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: ManifestDocument;
}

export const ComplianceManifestModal: React.FC<ComplianceManifestModalProps> = ({
  isOpen,
  onClose,
  manifest,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 text-slate-900">
        {/* Modal Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>CPCB C&amp;D Waste Management Rules Form-I Manifest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200 text-xs font-medium flex items-center gap-1"
              title="Print Manifest"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Clean Government & Environmental Audit Layout) */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          {/* Header Seal */}
          <div className="flex items-start justify-between border-b border-slate-300 pb-5">
            <div>
              <div className="text-2xs uppercase tracking-widest font-extrabold text-slate-500">
                Government of India &middot; CPCB / SPCB Circular Compliance
              </div>
              <h2 className="text-lg font-extrabold text-slate-950 mt-0.5">
                Digital C&amp;D Waste Disposal Manifest &amp; Green Certificate
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Valid for Municipal Occupancy Certificate &amp; IGBC / GRIHA Green Building Credits.
              </p>
            </div>

            {/* Simulated QR Code Stamp */}
            <div className="text-center p-2 border border-slate-300 rounded-lg bg-slate-50 shrink-0">
              <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white rounded-xs">
                <QrCode className="w-12 h-12" />
              </div>
              <span className="text-3xs font-mono text-slate-500 mt-1 block">
                QR VERIFIED
              </span>
            </div>
          </div>

          {/* Manifest Identifier Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-2xs text-slate-400 block">Manifest Serial No.</span>
              <strong className="font-mono text-slate-900 font-bold">{manifest.manifestNumber}</strong>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block">Date of Generation</span>
              <strong className="text-slate-900 tabular-nums">{manifest.dateGenerated}</strong>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block">Regulatory Authority</span>
              <strong className="text-emerald-700 font-semibold">{manifest.cpcbComplianceRef}</strong>
            </div>
          </div>

          {/* Section 1: Generator Details */}
          <div className="space-y-1.5 text-xs">
            <span className="text-2xs uppercase tracking-wider font-bold text-slate-500">
              1. Waste Generator &amp; Demolition Site
            </span>
            <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{manifest.generatorName}</div>
              <div className="text-slate-600">{manifest.siteAddress}</div>
            </div>
          </div>

          {/* Section 2: Logistics & Weighbridge Data */}
          <div className="space-y-1.5 text-xs">
            <span className="text-2xs uppercase tracking-wider font-bold text-slate-500">
              2. Authorized Logistics &amp; Certified Weighbridge Slips
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/60 rounded-lg border border-slate-200">
              <div>
                <span className="text-2xs text-slate-500 block">Carrier Vehicle</span>
                <strong className="text-slate-800">{manifest.vehicleNumber}</strong>
                <div className="text-2xs text-slate-500 mt-0.5">Driver: {manifest.driverContact}</div>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Tonnage Weight (Gross / Tare / Net)</span>
                <div className="font-mono font-bold text-slate-900 tabular-nums">
                  {manifest.grossWeightMT} MT &minus; {manifest.tareWeightMT} MT ={' '}
                  <span className="text-emerald-700">{manifest.netWeightMT} MT Net</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recovery Plant & Carbon Offsets */}
          <div className="space-y-1.5 text-xs">
            <span className="text-2xs uppercase tracking-wider font-bold text-slate-500">
              3. Processing Facility &amp; Carbon Mitigation Impact
            </span>
            <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">{manifest.destinationFacility}</div>
                  <div className="text-2xs text-slate-500">Auth Code: {manifest.facilityAuthCode}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-2xs font-bold">
                  100% Diverted from Landfill
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-2xs">
                <span>Material: <strong>{manifest.materialType}</strong></span>
                <span className="text-emerald-700 font-bold tabular-nums">
                  CO₂ Mitigated: {manifest.co2MitigatedKg} kg
                </span>
              </div>
            </div>
          </div>

          {/* Verification Footer Note */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-2xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronically authenticated by C&amp;D Setu Platform</span>
            </div>
            <span>QR Validation Code: {manifest.qrSeed}</span>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
