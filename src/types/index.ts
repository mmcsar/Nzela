// User Types
export type UserRole = 'admin' | 'company' | 'broker';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  brokerId?: string;
  createdAt: Date;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  province: 'haut-katanga' | 'lualaba';
  phone: string;
  email: string;
  ownerId: string;
  subscriptionId?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
}

// Broker Types
export interface Broker {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  province: 'haut-katanga' | 'lualaba';
  phone: string;
  email: string;
  ownerId: string;
  subscriptionId?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
}

// Location Types
export interface Location {
  address: string;
  city: string;
  province: 'haut-katanga' | 'lualaba';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Truck Types
export interface Truck {
  id: string;
  companyId: string;
  company?: Company;
  type: string;
  capacity: number;
  currentLocation: Location;
  availableDate: Date;
  destination?: Location;
  price: number;
  pricePerKm: number;
  status: 'available' | 'booked' | 'in-transit' | 'maintenance';
  features: string[];
  createdAt: Date;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  companyId: string;
  company?: Company;
  type: 'pickup' | 'van' | 'small-truck' | 'other';
  capacity: number;
  currentLocation: Location;
  availableDate: Date;
  price: number;
  status: 'available' | 'booked' | 'in-transit';
  createdAt: Date;
}

// Load Types
export interface Load {
  id: string;
  brokerId: string;
  broker?: Broker;
  origin: Location;
  destination: Location;
  distance: number;
  duration: string;
  trailerType: string;
  weight: number;
  price: number;
  pricePerKm: number;
  pickupDate: Date;
  deliveryDate: Date;
  status: 'available' | 'booked' | 'in-transit' | 'completed';
  createdAt: Date;
}

// BOL Types
export interface BOLItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
}

export interface BOL {
  id: string;
  loadId: string;
  truckId: string;
  shipper: Company | Broker;
  carrier: Company;
  origin: Location;
  destination: Location;
  items: BOLItem[];
  totalWeight: number;
  totalValue: number;
  pickupDate: Date;
  deliveryDate: Date;
  signature?: string;
  status: 'draft' | 'signed' | 'completed';
  createdAt: Date;
}

// Subscription Types
export type SubscriptionPlan = 'standard';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  createdAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: 'CDF' | 'USD';
  method: 'mobile-money' | 'bank-transfer' | 'card';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: Date;
}

// Matching Types
export interface Match {
  load: Load;
  truck: Truck;
  matchScore: number;
  distance: number;
  estimatedRevenue: number;
}

// ============================================
// GPS TRACKING TYPES
// ============================================
export interface TrackingUpdate {
  id: string;
  loadId: string;
  truckId: string;
  driverId?: string;
  coordinates: { lat: number; lng: number };
  speed?: number; // km/h
  heading?: number; // degrees
  timestamp: string;
  status: 'moving' | 'stopped' | 'idle';
  address?: string;
  eta?: string;
  distanceRemaining?: number; // km
}

export interface TrackingSession {
  id: string;
  loadId: string;
  truckId: string;
  startedAt: string;
  endedAt?: string;
  updates: TrackingUpdate[];
  currentPosition?: { lat: number; lng: number };
  status: 'active' | 'paused' | 'completed';
}

// ============================================
// WORKFLOW / SHIPMENT LIFECYCLE TYPES
// ============================================
export type ShipmentStatus =
  | 'available'
  | 'bid_accepted'
  | 'dispatched'
  | 'en_route_pickup'
  | 'at_pickup'
  | 'loaded'
  | 'in_transit'
  | 'at_delivery'
  | 'delivered'
  | 'pod_uploaded'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface ShipmentEvent {
  id: string;
  loadId: string;
  status: ShipmentStatus;
  timestamp: string;
  userId: string;
  notes?: string;
  location?: { lat: number; lng: number };
  photos?: string[]; // URLs
  signature?: string; // base64 or URL
}

export interface Dispute {
  id: string;
  loadId: string;
  raisedBy: string;
  reason: 'damage' | 'delay' | 'wrong_delivery' | 'missing_items' | 'overcharge' | 'other';
  description: string;
  evidence?: string[]; // photo URLs
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ============================================
// RATE ESTIMATION / MARKET RATES TYPES
// ============================================
export interface MarketRate {
  origin: string;
  destination: string;
  cargoType?: string;
  avgPricePerKm: number;
  minPricePerKm: number;
  maxPricePerKm: number;
  avgTotalPrice: number;
  sampleSize: number;
  period: string; // "last_30_days"
  currency: 'CDF' | 'USD';
}

export interface RateEstimate {
  origin: Location;
  destination: Location;
  distance: number;
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: 'high' | 'medium' | 'low';
  basedOn: number; // number of historical loads
  currency: 'CDF' | 'USD';
}

// ============================================
// DOCUMENT MANAGEMENT TYPES
// ============================================
export interface Document {
  id: string;
  loadId: string;
  type: 'bol' | 'pod' | 'invoice' | 'insurance' | 'permit' | 'photo' | 'contract';
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export interface ProofOfDelivery {
  id: string;
  loadId: string;
  bolId: string;
  receiverName: string;
  receiverSignature: string; // base64
  photos: string[];
  notes?: string;
  condition: 'good' | 'damaged' | 'partial';
  deliveredAt: string;
  createdAt: string;
}

// ============================================
// MESSAGING TYPES
// ============================================
export interface Conversation {
  id: string;
  load_id?: string;
  title?: string;
  type: 'load' | 'direct' | 'support';
  status: 'active' | 'archived' | 'closed';
  metadata?: Record<string, any>;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'observer';
  last_read_at?: string;
  notifications_enabled: boolean;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'location' | 'system';
  attachment_url?: string;
  metadata?: Record<string, any>;
  is_system: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// LOAD TEMPLATES & RECURRING TYPES
// ============================================
export interface LoadTemplate {
  id: string;
  userId: string;
  name: string;
  origin: Location;
  destination: Location;
  trailerType: string;
  weight: number;
  cargoType?: string;
  price?: number;
  notes?: string;
  usageCount: number;
  createdAt: string;
}

export interface RecurringLoad {
  id: string;
  templateId: string;
  userId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGenerated?: string;
  nextGeneration?: string;
  createdAt: string;
}

// ============================================
// RATING & REVIEW TYPES
// ============================================
export interface Rating {
  id: string;
  loadId: string;
  reviewerId: string;
  reviewerRole: 'broker' | 'company';
  revieweeId: string; // company or broker id
  revieweeType: 'company' | 'broker';
  overall: number; // 1-5
  communication: number; // 1-5
  punctuality: number; // 1-5
  reliability: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface RatingsSummary {
  entityId: string;
  entityType: 'company' | 'broker';
  averageOverall: number;
  averageCommunication: number;
  averagePunctuality: number;
  averageReliability: number;
  totalReviews: number;
  recentReviews: Rating[];
}

// ============================================
// LOAD ALERTS TYPES
// ============================================
export interface LoadAlert {
  id: string;
  userId: string;
  name: string;
  criteria: {
    originCity?: string;
    originProvince?: string;
    destinationCity?: string;
    destinationProvince?: string;
    cargoTypes?: string[];
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
    trailerTypes?: string[];
    radius?: number; // km
  };
  frequency: 'instant' | 'hourly' | 'daily';
  channels: ('email' | 'push' | 'sms')[];
  isActive: boolean;
  lastTriggered?: string;
  matchCount: number;
  createdAt: string;
}


