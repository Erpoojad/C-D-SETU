export type UserRole = 'generator' | 'buyer' | 'transporter' | 'recycler' | 'authority';

export type MaterialCategory =
  | 'concrete'
  | 'brick_masonry'
  | 'soil_gravel'
  | 'metals'
  | 'bitumen'
  | 'wood'
  | 'others';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  city: string;
  company: string;
  points: number;
}

export interface ReputationEvent {
  id: string;
  points: number;
  title: string;
  reason: string;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_company: string;
  seller_role: UserRole;
  title: string;
  category: MaterialCategory;
  grade: string;
  quantity: number;
  unit: 'MT' | 'CFT' | 'Nos';
  price_per_unit: number;
  location: string;
  city: string;
  lat: number | null;
  lng: number | null;
  condition: 'Segregated & Graded' | 'Clean Demolition' | 'Crushed Aggregates' | 'Raw Rubble';
  is_is383: boolean;
  lab_specs: { aiv?: string; acv?: string; water_absorption?: string; silt?: string } | null;
  description: string;
  photo_id: string | null;
  status: 'active' | 'sold_out' | 'withdrawn';
  created_at: string;
}

export type OrderStatus = 'requested' | 'accepted' | 'rejected' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_location: string;
  listing_city: string;
  unit: string;
  category: MaterialCategory;
  seller_id: string;
  buyer_id: string;
  seller_name: string;
  seller_phone: string;
  seller_company: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_company: string;
  quantity: number;
  delivery_site: string;
  distance_km: number;
  material_cost: number;
  freight_cost: number;
  note: string;
  status: OrderStatus;
  created_at: string;
}

export type VehicleCategory = 'Tractor Trolley' | 'Tata 407 (Medium)' | '6-Wheeler Tipper' | '10-Wheeler Heavy Tipper';

export interface Vehicle {
  id: string;
  category: VehicleCategory;
  registration: string;
  capacity_t: number;
  base_fare: number;
  rate_per_km: number;
  driver_name: string;
  driver_phone: string;
  active: boolean;
}

export type FacilityType = 'Centralized Plant' | 'Decentralized Micro-Crusher' | 'Direct Reuse Site' | 'Ward Collection Point';

export interface Facility {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  capacity_tpd: number;
  accepted_materials: MaterialCategory[];
  processing_cost_per_t: number;
  ulb_authorization: string;
}

export type PickupStatus = 'requested' | 'scheduled' | 'en_route' | 'picked_up' | 'completed' | 'cancelled';

export interface Pickup {
  id: string;
  generator_id: string;
  generator_name: string;
  generator_company: string;
  generator_phone: string | null;
  site_name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  material: MaterialCategory;
  segregated: boolean;
  estimated_tons: number;
  preferred_time: string | null;
  notes: string;
  status: PickupStatus;
  transporter_id: string | null;
  transporter_name: string | null;
  transporter_company: string | null;
  transporter_phone: string | null;
  vehicle_id: string | null;
  vehicle_category: string | null;
  vehicle_registration: string | null;
  vehicle_capacity_t: number | null;
  driver_name: string | null;
  driver_phone: string | null;
  facility_id: string | null;
  facility_name: string | null;
  facility_address: string | null;
  facility_owner_id: string | null;
  ulb_authorization: string | null;
  transport_fee: number | null;
  gross_t: number | null;
  tare_t: number | null;
  net_t: number | null;
  manifest_no: string | null;
  timeline: { status: PickupStatus; at: string; by: string; note: string }[];
  estimated_salvage_inr: number;
  co2_avoided_kg: number | null;
  created_at: string;
  completed_at: string | null;
}

export type ReportStatus = 'reported' | 'inspected' | 'dispatched' | 'cleared';

export interface DumpingReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  location: string;
  landmark: string;
  ward: string;
  city: string;
  lat: number | null;
  lng: number | null;
  est_tonnage: string;
  remarks: string;
  photo_id: string | null;
  status: ReportStatus;
  authority_note: string;
  created_at: string;
}

export interface ScanResult {
  isConstructionWaste: boolean;
  composition: Record<MaterialCategory, number>;
  estimatedVolumeM3: number | null;
  scaleReference: string;
  segregated: boolean;
  contaminants: string[];
  confidence: 'low' | 'medium' | 'high';
  advice: string;
  estimatedTonnes: number | null;
  dominantMaterial: MaterialCategory;
  salvageInrIfSegregated: number | null;
  mixedDisposalInr: number | null;
  co2AvoidedKg: number | null;
}

export interface Stats {
  platform: {
    users: number;
    active_listings: number;
    facilities: number;
    tonnes_diverted: number;
    pickups_completed: number;
    reports_cleared: number;
  };
  me: { tonnes: number; co2_kg: number; points: number } | null;
}
