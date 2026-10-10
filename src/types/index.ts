export type UserRole = 'generator' | 'buyer' | 'transporter' | 'recycler' | 'authority';

export type MaterialCategory = 
  | 'concrete'
  | 'brick_masonry'
  | 'soil_gravel'
  | 'metals'
  | 'bitumen'
  | 'wood'
  | 'others';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface ReputationEvent {
  id: string;
  date: string;
  title: string;
  pointsDelta: number;
  reason: string;
  type: 'gain' | 'penalty';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  city: string;
  companyOrAffiliation: string;
  avatar: string;
  reputationPoints: number;
  reputationLevel: 'Bronze Recycler' | 'Silver Recycler' | 'Gold Recycler' | 'Green Champion';
  totalDivertedMT: number;
  totalTransactions: number;
  co2SavedKg: number;
  badges: UserBadge[];
  history: {
    id: string;
    date: string;
    type: 'disposal' | 'purchase' | 'listing';
    title: string;
    quantity: number;
    unit: string;
    status: 'Scheduled' | 'En route' | 'Picked up' | 'Disposal complete';
    co2SavedKg: number;
    destinationOrSource: string;
  }[];
  reputationLog: ReputationEvent[];
}

export interface MaterialListing {
  id: string;
  title: string;
  category: MaterialCategory;
  grade?: string;
  quantity: number;
  unit: 'MT' | 'Tons' | 'CFT' | 'Nos';
  pricePerUnit: number; // 0 indicates free/exchange
  isFree?: boolean;
  originalPricePerUnit?: number;
  location: string;
  city: string;
  distanceKm: number;
  sellerName: string;
  sellerPhone?: string;
  sellerType: 'Contractor' | 'Recycling Facility' | 'Demolition Site' | 'Individual';
  isVerified: boolean;
  isIS383Certified: boolean;
  labSpecs?: {
    aivValue?: string;
    crushingStrength?: string;
    waterAbsorption?: string;
    siltContent?: string;
  };
  image: string;
  condition: 'Segregated & Graded' | 'Clean Demolition' | 'Crushed Aggregates' | 'Raw Rubble';
  co2SavedKgPerUnit: number;
  availableFrom: string;
  description?: string;
}

export interface VehicleOption {
  id: string;
  name: string;
  category: 'Tractor Trolley' | 'Tata 407 (Medium)' | '6-Wheeler Tipper' | '10-Wheeler Heavy Tipper';
  capacityTons: number;
  idealFor: string;
  baseFare: number;
  ratePerKm: number;
  driverName: string;
  driverRating: number;
  driverPhone: string;
  vehicleNumber: string;
  currentDistanceKm: number;
  etaMinutes: number;
  supportsAggregation: boolean;
}

export type PickupStatus = 'Scheduled' | 'En route' | 'Picked up' | 'Disposal complete';

export interface PickupRequest {
  id: string;
  siteName: string;
  address: string;
  city: string;
  generatorType: 'Homeowner' | 'Contractor' | 'Demolition Site';
  materialType: MaterialCategory;
  isSegregated: boolean;
  estimatedTons: number;
  assignedVehicle?: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicleNumber?: string;
  status: PickupStatus;
  statusTimeline: {
    status: PickupStatus;
    time: string;
    completed: boolean;
    description: string;
  }[];
  currentGps?: {
    lat: number;
    lng: number;
    label: string;
  };
  destinationPlant: string;
  estimatedSalvageValue: number;
  transportFee: number;
  netPayout: number;
  pickupTime: string;
  manifestId: string;
}

export interface FacilityNode {
  id: string;
  name: string;
  type: 'Centralized Plant' | 'Decentralized Micro-Crusher' | 'Direct Reuse Site' | 'Ward Malba Bank';
  address: string;
  city: string;
  cityTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  capacityTPD: number;
  currentUtilizationPercent: number;
  distanceKm: number;
  acceptedMaterials: MaterialCategory[];
  isULBAuthorized: boolean;
  isMobileTrailerUnit?: boolean;
  processingCostPerTon: number; // ₹ per ton
}

export interface IllegalDumpingReport {
  id: string;
  reporterName: string;
  location: string;
  landmark: string;
  wardNumber: string;
  city: string;
  timestamp: string;
  estimatedTonnage: string;
  status: 'Reported' | 'Inspected by ULB' | 'Vehicle Dispatched' | 'Cleared & Restored';
  imagePlaceholder: string;
  remarks: string;
}

export interface ManifestDocument {
  manifestNumber: string;
  generatorName: string;
  siteAddress: string;
  transporterName: string;
  vehicleNumber: string;
  driverContact: string;
  destinationFacility: string;
  facilityAuthCode: string;
  materialType: string;
  segregated: boolean;
  grossWeightMT: number;
  tareWeightMT: number;
  netWeightMT: number;
  dateGenerated: string;
  co2MitigatedKg: number;
  cpcbComplianceRef: string;
  qrVerificationUrl: string;
  qrSeed: string;
}

