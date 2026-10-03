export type LanguageCode = 'CN' | 'EN' | 'TR';
export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';
export type MembershipLevel = 'GUEST' | 'SILVER' | 'GOLD' | 'VIP';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BookingSource = 'APP' | 'MANUAL';

export interface MerchantSummary {
  id: string;
  businessName: string;
  category?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  contactInfo?: {
    phone?: string | null;
    email?: string | null;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  membershipLevel?: MembershipLevel;
  preferredLanguage: LanguageCode;
  trustScore?: number;
  travelStyle?: string | null;
  createdAt?: string;
  merchant?: MerchantSummary | null;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: Pick<User, 'id' | 'fullName'>;
}

export interface Slot {
  id: string;
  experienceId: string;
  startTime: string;
  endTime?: string;
  capacity: number;
  bookedCount: number;
  remaining: number;
  priceCny: number;
}

export interface Experience {
  id: string;
  merchantId: string;
  title: string;
  titleCn?: string | null;
  titleTr?: string | null;
  description: string;
  descriptionCn?: string | null;
  descriptionTr?: string | null;
  priceCny: number;
  duration?: string | null;
  capacity?: number | null;
  images: string[];
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  aiBadge?: string | null;
  merchant: MerchantSummary;
  slots?: Slot[];
  reviews?: Review[];
}

export interface BookingExperience {
  id: string;
  title: string;
  titleCn?: string | null;
  titleTr?: string | null;
  images?: string[];
  duration?: string | null;
  merchant: MerchantSummary;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  slotTime: string;
  guestCount: number;
  totalAmount: number;
  currency: string;
  guestName?: string | null;
  guestPhone?: string | null;
  notes?: string | null;
  cancelReason?: string | null;
  source: BookingSource;
  qrCode?: string | null;
  createdAt: string;
  experience: BookingExperience;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'phone'>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  type?: string;
  createdAt: string;
  isRead?: boolean;
}

export interface MerchantMeResponse {
  merchant: MerchantSummary;
  experiences: Array<{
    id: string;
    title: string;
    titleCn?: string | null;
    priceCny: number;
    capacity: number;
    duration?: string | null;
    isActive: boolean;
  }>;
}
