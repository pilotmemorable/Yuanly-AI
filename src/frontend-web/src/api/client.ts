// ─── Yuanly AI API Client ──────────────────────────────────────────────────
// Central HTTP client for all backend calls. Handles JWT token injection,
// error normalisation, and typed wrappers for every endpoint.

const BASE_URL = 'http://localhost:5000/v1';

// ── Token storage ───────────────────────────────────────────────────────────

const TOKEN_KEY = 'yuanly_token';
const REFRESH_KEY = 'yuanly_refresh';
const USER_KEY = 'yuanly_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, refresh?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  nickname?: string;
  avatar?: string;
  role: 'tourist' | 'merchant' | 'admin';
  merchantId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  requires2FA?: boolean;
  tempToken?: string;
}

export interface Experience {
  id: string;
  merchantId: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  category: string;
  location: string;
  city: string;
  price: number;
  currency: string;
  durationMinutes: number;
  maxParticipants: number;
  images: string[];
  rating: number;
  reviewCount: number;
  status: 'active' | 'inactive' | 'draft' | 'pending';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  experienceId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  price: number;
  status: 'available' | 'full' | 'closed';
}

export interface Booking {
  id: string;
  userId: string;
  userNickname?: string;
  experienceId: string;
  experienceTitle?: string;
  slotId: string;
  slotDate?: string;
  slotTime?: string;
  participants: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'on_hold' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  qrCode?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  businessNameZh?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  city: string;
  category: string;
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  verificationDocs?: string[];
  createdAt: string;
  description?: string;
  logo?: string;
}

export interface Review {
  id: string;
  experienceId: string;
  userId: string;
  userNickname: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  monthlyBookings: { month: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  recentBookings: Booking[];
  topExperiences: { id: string; title: string; bookings: number; revenue: number }[];
}

export interface AdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalExperiences: number;
  totalBookings: number;
  totalRevenue: number;
  pendingMerchants: number;
  activeBookings: number;
  monthlyGrowth: number;
  bookingsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topMerchants: { id: string; name: string; bookings: number; revenue: number }[];
}

export interface FinancialOverview {
  totalRevenue: number;
  platformCommission: number;
  merchantPayouts: number;
  pendingPayouts: number;
  refundedAmount: number;
  transactions: PaymentTransaction[];
  revenueByMerchant: { merchantId: string; merchantName: string; revenue: number; commission: number }[];
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'payout' | 'commission';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Core fetch wrapper ──────────────────────────────────────────────────────

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = data?.message || data?.error || `Request failed (${res.status})`;
      throw new ApiError(res.status, msg);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError) {
      throw new ApiError(0, '无法连接到服务器，请检查网络连接。');
    }
    throw err;
  }
}

// Convenience methods
const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  wechatLogin: (data: { code: string; wechatId?: string }) =>
    post<AuthResponse>('/auth/wechat-login', data),
  register: (data: { phone: string; email?: string; nickname?: string; password: string; role?: string }) =>
    post<AuthResponse>('/auth/register', data),
  verify2FA: (data: { tempToken: string; code: string }) =>
    post<AuthResponse>('/auth/verify-2fa', data),
  me: () => get<User>('/auth/me'),
  updateMe: (data: Partial<User>) => put<User>('/auth/me', data),
};

// ── Experience API ──────────────────────────────────────────────────────────

export const experienceApi = {
  explore: (params?: { page?: number; limit?: number; category?: string; city?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    if (params?.city) qs.set('city', params.city);
    return get<PaginatedResponse<Experience> | Experience[]>(`/experiences/explore${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  getById: (id: string) => get<Experience>(`/experiences/${id}`),
  search: (query: string, filters?: { city?: string; category?: string; minPrice?: number; maxPrice?: number }) => {
    const qs = new URLSearchParams({ q: query });
    if (filters?.city) qs.set('city', filters.city);
    if (filters?.category) qs.set('category', filters.category);
    if (filters?.minPrice !== undefined) qs.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) qs.set('maxPrice', String(filters.maxPrice));
    return get<PaginatedResponse<Experience> | Experience[]>(`/experiences/search?${qs.toString()}`);
  },
  trending: () => get<Experience[]>(`/experiences/trending`),
};

// ── Booking API ─────────────────────────────────────────────────────────────

export const bookingApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<Booking> | Booking[]>(`/bookings${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  hold: (data: { experienceId: string; slotId: string; participants: number }) =>
    post<Booking>('/bookings/hold', data),
  confirm: (data: { bookingId: string; paymentMethod?: string }) =>
    post<Booking>('/bookings/confirm', data),
  cancel: (id: string, reason?: string) =>
    post<Booking>(`/bookings/${id}/cancel`, { reason }),
  getQR: (id: string) => get<{ qrCode: string }>(`/bookings/${id}/qr`),
};

// ── Payment API ─────────────────────────────────────────────────────────────

export const paymentApi = {
  initiate: (data: { bookingId: string; method: string }) =>
    post<{ paymentId: string; payUrl: string }>('/payment/initiate', data),
  status: (id: string) => get<{ status: string; paidAt?: string }>(`/payment/${id}/status`),
};

// ── Merchant API ────────────────────────────────────────────────────────────

export const merchantApi = {
  list: () => get<Merchant[]>('/merchants'),
  getById: (id: string) => get<Merchant>(`/merchants/${id}`),
  register: (data: {
    businessName: string;
    businessNameZh?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    city: string;
    category: string;
    description?: string;
    password: string;
  }) => post<{ merchant: Merchant; token: string; user: User }>('/merchants/register', data),
  update: (id: string, data: Partial<Merchant>) => put<Merchant>(`/merchants/${id}`, data),
  dashboard: (id: string) => get<DashboardStats>(`/merchants/${id}/dashboard`),
  createExperience: (merchantId: string, data: Partial<Experience>) =>
    post<Experience>(`/merchants/${merchantId}/experiences`, data),
  updateExperience: (merchantId: string, expId: string, data: Partial<Experience>) =>
    put<Experience>(`/merchants/${merchantId}/experiences/${expId}`, data),
  deleteExperience: (merchantId: string, expId: string) =>
    del<{ success: boolean }>(`/merchants/${merchantId}/experiences/${expId}`),
};

// ── Review API ──────────────────────────────────────────────────────────────

export const reviewApi = {
  listByExperience: (experienceId: string) => get<Review[]>(`/reviews/experience/${experienceId}`),
  create: (data: { experienceId: string; rating: number; comment: string }) =>
    post<Review>('/reviews', data),
};

// ── Slot API ────────────────────────────────────────────────────────────────

export const slotApi = {
  available: (params: { experienceId?: string; date?: string }) => {
    const qs = new URLSearchParams();
    if (params.experienceId) qs.set('experienceId', params.experienceId);
    if (params.date) qs.set('date', params.date);
    return get<Slot[]>(`/slots/available${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  create: (data: { experienceId: string; startTime: string; endTime: string; capacity: number; price: number }) =>
    post<Slot>('/slots', data),
  bulkCreate: (data: { experienceId: string; slots: { startTime: string; endTime: string; capacity: number; price: number }[] }) =>
    post<Slot[]>('/slots/bulk', data),
  delete: (id: string) => del<{ success: boolean }>(`/slots/${id}`),
};

// ── AI API ──────────────────────────────────────────────────────────────────

export const aiApi = {
  interact: (data: { message: string; context?: Record<string, unknown> }) =>
    post<{ reply: string; suggestions?: string[] }>('/ai/interact', data),
  translate: (data: { text: string; from: string; to: string }) =>
    post<{ translatedText: string }>('/ai/translate', data),
  recommend: (params?: { preferences?: string; budget?: number }) =>
    get<{ recommendations: Experience[] }>(`/ai/recommend${params?.preferences ? '?preferences=' + encodeURIComponent(params.preferences) : ''}`),
};

// ── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => get<AdminStats>('/admin/stats'),
  pendingMerchants: () => get<Merchant[]>('/admin/merchants/pending'),
  verifyMerchant: (id: string, data: { approved: boolean; notes?: string }) =>
    put<Merchant>(`/admin/merchants/${id}/verify`, data),
  allBookings: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<Booking> | Booking[]>(`/admin/bookings${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  financial: () => get<FinancialOverview>('/admin/financial'),
};

export { ApiError };