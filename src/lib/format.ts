import type { MaterialCategory, PickupStatus, UserRole, OrderStatus, ReportStatus } from '../types';
import { MATERIAL_LABELS } from './cdFactors';

export const MATERIALS = Object.keys(MATERIAL_LABELS) as MaterialCategory[];
export const materialLabel = (m: MaterialCategory) => MATERIAL_LABELS[m] ?? m;

export const ROLE_LABELS: Record<UserRole, string> = {
  generator: 'Waste generator',
  buyer: 'Material buyer',
  transporter: 'Transporter',
  recycler: 'Recycler / plant',
  authority: 'Municipal authority',
};

export const ROLE_HINTS: Record<UserRole, string> = {
  generator: 'Builder, contractor or homeowner with debris to dispose of',
  buyer: 'Contractor buying recycled aggregate, bricks or steel',
  transporter: 'Tipper or tractor owner who carries loads',
  recycler: 'Runs a crusher, plant or reuse site that accepts waste',
  authority: 'ULB officer who monitors pickups and dumping reports',
};

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  requested: 'Waiting for transporter',
  scheduled: 'Transporter assigned',
  en_route: 'Truck on the way',
  picked_up: 'Picked up',
  completed: 'Delivered & manifested',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  requested: 'Awaiting seller',
  accepted: 'Accepted',
  rejected: 'Rejected',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  reported: 'Reported',
  inspected: 'Inspected by ULB',
  dispatched: 'Clean-up vehicle dispatched',
  cleared: 'Cleared',
};

export const inr = (n: number | null | undefined) =>
  n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

export const num = (n: number | null | undefined, digits = 1) =>
  n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits });

export const dateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '—';

export const date = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
