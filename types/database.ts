// Database type definitions

export interface User {
  uid: string;
  email: string;
  password: string;
  display_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  join_date?: Date;
  updated_at?: Date;
  pref_notifications?: boolean;
  pref_newsletter?: boolean;
  pref_marketing?: boolean;
  pref_profile_visibility?: 'public' | 'private' | 'friends';
  pref_show_email?: boolean;
  pref_show_phone?: boolean;
  pref_show_location?: boolean;
}

export interface Tour {
  id: string;
  banner?: string;
  title: string;
  subdescription?: string;
  description: string;
  max_altitude?: string;
  duration: string;
  price: number;
  difficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  imageUrl: string;
  images?: any;
  location: string;
  lat?: number;
  lng?: number;
  maxGroupSize?: number;
  startDates?: any;
  included?: any;
  notIncluded?: any;
  category: string;
  subCategory: string;
  isWeekendTrip?: boolean;
  schedule?: any;
  isActive?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TourReview {
  id: string;
  tour_id: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  user_photo_url?: string;
  rating: number;
  comment: string;
  title?: string;
  created_at?: Date;
}

export interface Favorite {
  id: string;
  user_id: string;
  tour_id: string;
  tour_name: string;
  tour_image?: string;
  added_at?: Date;
}

export interface TravelHistory {
  id: string;
  user_id: string;
  tour_id: string;
  tour_name: string;
  tour_image?: string;
  booking_date: Date;
  travel_date: Date;
  status?: 'completed' | 'cancelled' | 'upcoming';
  rating?: number;
  review?: string;
}

export interface Member {
  id: string;
  name: string;
  mobile_number: string;
  booking_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PickupPoint {
  id: string;
  location_name: string;
  map_link: string;
  status: 'Active' | 'Inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'upi' | 'netbanking';
  last4?: string;
  card_type?: string;
  upi_id?: string;
  bank_name?: string;
  is_default?: boolean;
  added_at?: Date;
}

export interface Ticket {
  ticket_id: string;
  user_id: string;
  user_name: string;
  event_id: string;
  event_name: string;
  status?: 'booked' | 'cancelled' | 'used';
  valid_until: Date;
  created_at?: Date;
}

export interface TourSlot {
  id?: number;
  tour_id: string;
  slot_date: string; // DATE format: YYYY-MM-DD
  slot_time: string; // TIME format: HH:MM:SS
  slot_end_date?: string; // DATE only, YYYY-MM-DD (no time)
  total_capacity?: number; // slot capacity
  duration_label?: string;
  created_at?: Date;
}

export interface TourSlotVariant {
  id?: number;
  slot_id: number;
  variant_name: string;
  description?: string;
  price: number;
  capacity: number;
  created_at?: Date;
}

export interface Booking {
  id: string;
  user_id: string;
  tour_id: string;
  slot_id?: number;
  variant_id?: number;
  seats?: number;
  tour_name: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  number_of_seats?: number;
  payment_type?: 'Advance' | 'Full';
  payment_proof?: string;
  payment_status?: 'Verified' | 'Not Verified';
  booking_status?: 'Pending' | 'Confirmed' | 'Rejected' | 'cancelled' | 'completed';
  booking_date?: Date;
  travel_date: Date;
  total_amount?: number;
  payment_method_id?: string;
  ticket_id?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  status?: 'Pending' | 'Confirmed' | 'Rejected' | 'cancelled' | 'completed'; // Alternative field name
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string;
  images?: any;
  price?: number;
  capacity?: number;
  registered_count?: number;
  category: string;
  highlights?: any;
  participants?: any;
  team_leader: string;
  sections?: any;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface BlogPost {
  id: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  images?: any;
  author: string;
  created_at?: Date;
  tags?: any;
  sections?: any;
  is_published?: boolean;
  updated_at?: Date;
}

export type LeadState = 'Hot' | 'Warm' | 'Cold';
export type LeadSource = 'other' | 'manual' | 'onelink';

export type LeadStatus =
  | 'New Enquiry'
  | 'Call Not Picked'
  | 'Contacted'
  | 'Qualified'
  | 'Plan & Quote Sent'
  | 'In Pipeline'
  | 'Negotiating'
  | 'Awaiting Payment'
  | 'Booked'
  | 'Lost & Closed'
  | 'Future Prospect';

export interface Lead {
  id?: number;
  name: string;
  email: string;
  phone_country_code?: string;
  phone_number: string;
  lead_source?: LeadSource;
  lead_state?: LeadState;
  lead_status?: LeadStatus;
  assigned_to?: string; // users.uid
  enquiry_destination?: string;
  tour_id?: string;
  event_id?: string;
  slot_id?: number;
  notes?: string;
  remarks?: string;
  converted_to_booking_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Coupon level: company, event, batch
export type CouponLevel = 'company' | 'event' | 'batch';
export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponDiscountApplicable = 'per_person' | 'per_order' | 'per_ticket';
export type CouponType = 'private' | 'public';
export type CouponValidityType = 'fixed_date' | 'relative_date';

export interface Coupon {
  id?: number;
  coupon_level: CouponLevel;
  coupon_code: string;
  discount_type: CouponDiscountType;
  discount_applicable: CouponDiscountApplicable;
  discount: number;
  coupon_inventory: number;
  group_size?: number | null;
  affiliate_email?: string | null;
  coupon_type: CouponType;
  valid_from?: string | null; // DATE YYYY-MM-DD
  valid_till?: string | null;
  validity_type: CouponValidityType;
  company_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
  // Populated by API when level is event or batch:
  event_ids?: string[];
  slot_ids?: number[];
}

// Navigation permissions structure for super users
export interface NavigationPermissions {
  my_events?: boolean;
  leads?: {
    enabled?: boolean;
    channel_leads?: boolean;
    missed_checkouts?: boolean;
  };
  bookings?: {
    enabled?: boolean;
    all_bookings?: boolean;
    transactions?: boolean;
    settlements?: boolean;
    customers?: boolean;
    refunds?: boolean;
  };
  calendar?: boolean;
  coupons?: boolean;
  operations?: boolean;
  oneinbox?: boolean;
  onelink?: boolean;
  instagram?: boolean;
  whatsapp?: boolean;
  pickup_points?: boolean;
  analytics?: {
    enabled?: boolean;
    lead_analytics?: boolean;
    booking_analytics?: boolean;
  };
  policies?: boolean;
  settings?: boolean;
  user_management?: boolean;
}

export interface SuperUser {
  id?: number;
  user_id: string; // References users.uid
  email: string;
  display_name?: string;
  is_active: boolean | number; // Native active status (1 = active, 0 = inactive)
  navigation_permissions: NavigationPermissions | string; // JSON string in DB, object in TypeScript
  created_at?: Date;
  updated_at?: Date;
}

/** Curated category (e.g. homepage carousel). */
export interface CuratedCategory {
  id?: number;
  name: string;
  image?: string | null;
  tag?: string | null;
  main_category?: string | null;
  sub_category?: string | null;
  sort_order?: number;
  is_active?: number | boolean; // 1 = active, 0 = inactive
  created_at?: Date;
  updated_at?: Date;
}
