export type DoctorStatus = 'AVAILABLE' | 'LUNCH' | 'SURGERY' | 'LEAVE';

export type PatientStatus = 'WAITING' | 'IN_CABIN' | 'COMPLETED' | 'NOT_AVAILABLE' | 'EMERGENCY';

export type BookingType = 'WALK_IN' | 'ONLINE';

export type PaymentStatus = 'FREE' | 'PAID' | 'PENDING';

export type EstablishmentType = 'CLINIC' | 'HOSPITAL';

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialty: string;
  clinicName: string;
  cabinNumber: string;
  address: string;
  city: string;
  phone: string;
  timings: string;
  consultationFee: number; // Regular clinic fee (e.g. 500)
  onlineTokenFee: number; // Always ₹20 platform SaaS fee
  status: DoctorStatus;
  statusNote?: string;
  staffUsername: string;
  staffPassword: string;
  profilePic?: string;
  clinicImages?: string[];
  tags?: string[]; // Invisible SEO & Search Tags
  morningShift?: string;   // e.g. '10:00 AM - 02:00 PM'
  eveningShift?: string;   // e.g. '05:00 PM - 08:00 PM'
  avgTimePerPatientMinutes: number;
  createdAt: string;

  // Hospital & Hierarchy Linkage
  establishmentType?: EstablishmentType; // 'CLINIC' ya 'HOSPITAL'
  hospitalId?: string; // Parent Hospital ID / Username (e.g. 'aditya_hospital_shahdol')

  // Razorpay Payment Configuration for this doctor/clinic
  razorpayEnabled?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayAccountType?: 'DIRECT' | 'PLATFORM_SPLIT';
}

export interface Patient {
  id: string;
  doctorId: string;
  hospitalId?: string; // Parent Hospital Linkage (e.g. 'aditya_hospital_shahdol')
  tokenNumber: number;
  name: string;
  mobile: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  complaint: string;
  appointmentDate?: string; // YYYY-MM-DD format (e.g. '2026-11-05')
  selectedShift?: string;   // 'Morning' ya 'Evening'
  bookingType: BookingType; // WALK_IN is free; ONLINE is ₹20 paid
  status: PatientStatus;
  paymentStatus: PaymentStatus;
  paymentAmount: number; // 0 for WALK_IN, 20 for ONLINE
  paymentId?: string;
  isEmergency: boolean;
  createdAt: string;
  calledInAt?: string;
  completedAt?: string;
  botCallAlertSent: boolean;
  botCallAlertSentAt?: string;
  estimatedWaitMinutes?: number;
}

export interface Hospital {
  id: string; // e.g. 'aditya_hospital_shahdol'
  name: string;
  city: string;
  address: string;
  phone: string;
  staffUsername: string;
  staffPassword: string;
  doctorIds: string[];
  createdAt: string;
}

export interface SummaryReport {
  period: 'day' | 'week' | 'month' | 'year';
  totalRegistered: number;
  totalCompleted: number;
  totalWaiting: number;
  totalWalkIn: number;
  totalOnline: number;
  totalEmergency: number;
  totalNotAvailable: number;
  avgWaitTimeMinutes: number;
  totalOnlineRevenueDoctorTokens: number;
}

export interface AdminAnalytics {
  totalRevenue: number; // from online bookings @ ₹20
  todayRevenue: number;
  totalOnlineBookings: number;
  todayOnlineBookings: number;
  totalWalkInPatients: number;
  todayWalkInPatients: number;
  totalDoctors: number;
  activeDoctors: number;
}

export interface VoiceBotSettings {
  enabled: boolean;
  triggerThreshold: number; // e.g. 3 or 4 patients ahead
  telephonyProvider: 'IN_APP_VOICE' | 'EXOTEL' | 'TWILIO' | 'SARV';
  apiKey?: string;
  apiSecret?: string;
  callerId?: string;
  messageTemplate: string;
  autoRetryFailed: boolean;
  maxRetries: number;
}

export interface GlobalRazorpaySettings {
  enabled: boolean;
  mode: 'test' | 'live';
  keyId: string;
  keySecret: string;
  merchantName: string;
  themeColor: string;
}
