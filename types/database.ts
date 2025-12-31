<<<<<<< HEAD
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

export interface Booking {
  id: string;
  user_id: string;
  tour_id: string;
  tour_name: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  number_of_seats?: number;
  payment_type?: 'Advance' | 'Full';
  payment_proof?: string;
  payment_status?: 'Verified' | 'Not Verified';
  booking_status?: 'Pending' | 'Confirmed' | 'Rejected';
  booking_date?: Date;
  travel_date: Date;
  total_amount?: number;
  payment_method_id?: string;
  ticket_id?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
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

=======
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

>>>>>>> 050a1f9 (Initial commit)
