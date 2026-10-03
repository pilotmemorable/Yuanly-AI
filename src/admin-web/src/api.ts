export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';
export type MerchantCategory = 'PARAGLIDING' | 'BALLOON' | 'TOUR' | 'HOTEL' | 'OTHER';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BookingSource = 'APP' | 'MANUAL';
export type MembershipLevel = 'GUEST' | 'SILVER' | 'GOLD' | 'VIP';
export type PreferredLanguage = 'CN' | 'EN' | 'TR';

type UnknownRecord = Record<string, unknown>;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ContactInfo {
  phone?: string | null;
  email?: string | null;
}

export interface Representative {
  id: string;
  email: string;
  fullName: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  category: MerchantCategory | string;
  location: string;
  description?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  commissionRate?: number | null;
  isVerified: boolean;
  isActive: boolean;
  rating?: number | null;
  representative?: Representative | null;
  _count?: {
    experiences: number;
  };
  contactInfo?: ContactInfo | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  membershipLevel?: MembershipLevel;
  preferredLanguage?: PreferredLanguage;
  trustScore?: number;
  travelStyle?: string | null;
  createdAt: string;
  merchant: Merchant | null;
  _count?: {
    bookings: number;
  };
}

export interface Slot {
  id: string;
  experienceId: string;
  startTime: string;
  endTime: string;
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
  tags: string[];
  rating?: number | null;
  reviewCount?: number | null;
  isActive: boolean;
  aiBadge?: string | boolean | null;
  merchant?: Merchant | null;
  slots?: Slot[];
}

export interface BookingUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
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
  source: BookingSource | string;
  qrCode?: string | null;
  createdAt: string;
  experience: Experience;
  user?: BookingUser | null;
  merchant?: Merchant | null;
}

export interface AdminStats {
  totals: {
    users: number;
    merchantUsers: number;
    merchants: number;
    experiences: number;
    bookings: number;
    pendingBookings: number;
    pendingMerchants: number;
  };
  bookingsByStatus: Record<string, number>;
  recentBookings: Booking[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorLabel: string;
  createdAt: string;
  details: string;
  raw: UnknownRecord;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface MerchantsResponse {
  merchants: Merchant[];
}

export interface ExperiencesResponse {
  experiences: Experience[];
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: Pagination;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
}

export interface CreateMerchantInput {
  businessName: string;
  category: MerchantCategory;
  location: string;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
  commissionRate?: number;
}

export interface UpdateMerchantInput extends Partial<CreateMerchantInput> {
  isVerified?: boolean;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string;
  role: Extract<UserRole, 'USER' | 'MERCHANT'>;
  merchantId?: string;
  merchant?: CreateMerchantInput;
}

export interface UpdateUserRoleInput {
  role: Extract<UserRole, 'USER' | 'MERCHANT'>;
  merchantId?: string;
}

export interface CreateExperienceInput {
  merchantId: string;
  title: string;
  titleCn?: string;
  titleTr?: string;
  description: string;
  descriptionCn?: string;
  descriptionTr?: string;
  priceCny: number;
  duration?: string;
  capacity?: number;
  images?: string[];
  tags?: string[];
}

export interface UpdateExperienceInput extends Partial<CreateExperienceInput> {
  isActive?: boolean;
}

export interface CreateBulkSlotsInput {
  startDate: string;
  endDate: string;
  times: string[];
  capacity?: number;
  priceCny?: number;
}

export interface UpdateBookingStatusInput {
  status: BookingStatus;
  reason?: string;
}

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  body?: unknown;

  constructor(message: string, status: number, errorCode?: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.body = body;
  }
}

const API_BASE = (import.meta.env.VITE_API_URL || '/v1').replace(/\/$/, '');

let authHandlers: {
  getToken: () => string | null;
  onUnauthorized: () => void;
} = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureApiAuth(handlers: typeof authHandlers): void {
  authHandlers = handlers;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function asOptionalString(value: unknown): string | null {
  const text = asString(value).trim();
  return text ? text : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = asNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

function normalizeContactInfo(value: unknown): ContactInfo | null {
  const record = asRecord(value);
  const phone = asOptionalString(record.phone ?? record.contactPhone);
  const email = asOptionalString(record.email ?? record.contactEmail);
  if (!phone && !email) return null;
  return { phone, email };
}

function normalizeRepresentative(value: unknown): Representative | null {
  const record = asRecord(value);
  const id = asString(record.id);
  if (!id) return null;
  return {
    id,
    email: asString(record.email),
    fullName: asString(record.fullName),
  };
}

function normalizeMerchant(value: unknown): Merchant {
  const record = asRecord(value);
  const contactInfo = normalizeContactInfo(record.contactInfo);
  const counts = asRecord(record._count);

  return {
    id: asString(record.id),
    businessName: asString(record.businessName),
    category: asString(record.category) as MerchantCategory | string,
    location: asString(record.location),
    description: asOptionalString(record.description),
    contactPhone: asOptionalString(record.contactPhone) ?? contactInfo?.phone ?? null,
    contactEmail: asOptionalString(record.contactEmail) ?? contactInfo?.email ?? null,
    commissionRate: asNullableNumber(record.commissionRate),
    isVerified: asBoolean(record.isVerified),
    isActive: asBoolean(record.isActive, true),
    rating: asNullableNumber(record.rating),
    representative: normalizeRepresentative(record.representative),
    _count: { experiences: asNumber(counts.experiences) },
    contactInfo,
  };
}

function normalizeUser(value: unknown): User {
  const record = asRecord(value);
  const counts = asRecord(record._count);
  return {
    id: asString(record.id),
    email: asString(record.email),
    fullName: asString(record.fullName),
    phone: asOptionalString(record.phone),
    avatar: asOptionalString(record.avatar),
    role: asString(record.role, 'USER') as UserRole,
    membershipLevel: asString(record.membershipLevel, 'GUEST') as MembershipLevel,
    preferredLanguage: asString(record.preferredLanguage, 'TR') as PreferredLanguage,
    trustScore: asNumber(record.trustScore),
    travelStyle: asOptionalString(record.travelStyle),
    createdAt: asString(record.createdAt),
    merchant: record.merchant ? normalizeMerchant(record.merchant) : null,
    _count: { bookings: asNumber(counts.bookings) },
  };
}

function normalizeSlot(value: unknown): Slot {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    experienceId: asString(record.experienceId),
    startTime: asString(record.startTime),
    endTime: asString(record.endTime),
    capacity: asNumber(record.capacity),
    bookedCount: asNumber(record.bookedCount),
    remaining: asNumber(record.remaining),
    priceCny: asNumber(record.priceCny),
  };
}

function normalizeExperience(value: unknown): Experience {
  const record = asRecord(value);
  const merchant = record.merchant ? normalizeMerchant(record.merchant) : null;
  return {
    id: asString(record.id),
    merchantId: asString(record.merchantId ?? merchant?.id),
    title: asString(record.title),
    titleCn: asOptionalString(record.titleCn),
    titleTr: asOptionalString(record.titleTr),
    description: asString(record.description),
    descriptionCn: asOptionalString(record.descriptionCn),
    descriptionTr: asOptionalString(record.descriptionTr),
    priceCny: asNumber(record.priceCny),
    duration: asOptionalString(record.duration),
    capacity: asNullableNumber(record.capacity),
    images: asStringArray(record.images),
    tags: asStringArray(record.tags),
    rating: asNullableNumber(record.rating),
    reviewCount: asNullableNumber(record.reviewCount),
    isActive: asBoolean(record.isActive, true),
    aiBadge: (record.aiBadge as string | boolean | null | undefined) ?? null,
    merchant,
    slots: Array.isArray(record.slots) ? record.slots.map(normalizeSlot) : undefined,
  };
}

function normalizeBookingUser(value: unknown): BookingUser | null {
  const record = asRecord(value);
  if (!record.id && !record.email && !record.fullName) return null;
  return {
    id: asString(record.id),
    fullName: asString(record.fullName),
    email: asString(record.email),
    phone: asOptionalString(record.phone),
  };
}

function normalizeBooking(value: unknown): Booking {
  const record = asRecord(value);
  const experience = normalizeExperience(record.experience);
  const merchant = record.merchant ? normalizeMerchant(record.merchant) : experience.merchant ?? null;
  return {
    id: asString(record.id),
    status: asString(record.status, 'PENDING') as BookingStatus,
    slotTime: asString(record.slotTime),
    guestCount: asNumber(record.guestCount),
    totalAmount: asNumber(record.totalAmount),
    currency: asString(record.currency, 'CNY'),
    guestName: asOptionalString(record.guestName),
    guestPhone: asOptionalString(record.guestPhone),
    notes: asOptionalString(record.notes),
    cancelReason: asOptionalString(record.cancelReason),
    source: asString(record.source, 'APP') as BookingSource | string,
    qrCode: asOptionalString(record.qrCode),
    createdAt: asString(record.createdAt),
    experience,
    user: normalizeBookingUser(record.user),
    merchant,
  };
}

function normalizePagination(value: unknown): Pagination {
  const record = asRecord(value);
  const page = asNumber(record.page, 1);
  const limit = Math.max(1, asNumber(record.limit, 10));
  const total = asNumber(record.total, 0);
  const fallbackPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    pages: Math.max(1, asNumber(record.pages, fallbackPages)),
  };
}

function normalizeStats(value: unknown): AdminStats {
  const record = asRecord(value);
  const totals = asRecord(record.totals);
  const rawStatuses = asRecord(record.bookingsByStatus);
  const bookingsByStatus = Object.fromEntries(
    Object.entries(rawStatuses).map(([key, statusValue]) => [key, asNumber(statusValue)]),
  );

  return {
    totals: {
      users: asNumber(totals.users),
      merchantUsers: asNumber(totals.merchantUsers),
      merchants: asNumber(totals.merchants),
      experiences: asNumber(totals.experiences),
      bookings: asNumber(totals.bookings),
      pendingBookings: asNumber(totals.pendingBookings),
      pendingMerchants: asNumber(totals.pendingMerchants),
    },
    bookingsByStatus,
    recentBookings: Array.isArray(record.recentBookings) ? record.recentBookings.map(normalizeBooking) : [],
  };
}

function normalizeAuditLog(value: unknown, index: number): AuditLog {
  const record = asRecord(value);
  const actor = asRecord(record.actor);
  const admin = asRecord(record.admin);
  const user = asRecord(record.user);
  const detailsValue =
    record.details ?? record.message ?? record.description ?? record.metadata ?? record.payload ?? record.changes ?? record.reason ?? '—';

  return {
    id: asString(record.id, `log-${index}`),
    action: asString(record.action ?? record.event ?? record.type ?? record.activity, 'İşlem'),
    entityType: asString(record.entityType ?? record.targetType ?? record.resourceType ?? record.subjectType ?? record.scope, 'Kaynak'),
    entityId: asString(record.entityId ?? record.targetId ?? record.resourceId ?? record.subjectId ?? record.recordId, '—'),
    actorLabel: asString(
      actor.email ??
        admin.email ??
        user.email ??
        actor.fullName ??
        admin.fullName ??
        user.fullName ??
        record.adminEmail ??
        record.userEmail,
      'Sistem',
    ),
    createdAt: asString(record.createdAt ?? record.timestamp ?? record.loggedAt ?? record.date ?? new Date().toISOString()),
    details: typeof detailsValue === 'string' ? detailsValue : JSON.stringify(detailsValue, null, 2),
    raw: record,
  };
}

async function request(path: string, init: RequestInit = {}, options: { auth?: boolean } = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Accept-Language', 'tr');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = authHandlers.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  if (!response.ok) {
    const body = asRecord(payload);
    const message = asString(body.error ?? body.message, `İstek başarısız oldu (${response.status}).`);
    const errorCode = asOptionalString(body.error_code) ?? undefined;

    if (response.status === 401 && options.auth) {
      authHandlers.onUnauthorized();
    }

    throw new ApiError(message, response.status, errorCode, payload);
  }

  return payload;
}

export const api = {
  async login(input: { email: string; password: string }): Promise<LoginResponse> {
    const payload = asRecord(
      await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );

    return {
      token: asString(payload.token),
      user: normalizeUser(payload.user),
    };
  },

  async getMe(): Promise<{ user: User }> {
    const payload = asRecord(await request('/auth/me', {}, { auth: true }));
    return { user: normalizeUser(payload.user) };
  },

  async changePassword(input: { currentPassword: string; newPassword: string }): Promise<MessageResponse> {
    const payload = asRecord(
      await request(
        '/auth/change-password',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { message: asString(payload.message, 'Şifre güncellendi.') };
  },

  async getAdminStats(): Promise<AdminStats> {
    return normalizeStats(await request('/admin/stats', {}, { auth: true }));
  },

  async getAdminUsers(params: {
    role?: Extract<UserRole, 'USER' | 'MERCHANT'>;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const payload = asRecord(
      await request(`/admin/users${buildQuery(params)}`, {}, { auth: true }),
    );
    return {
      users: Array.isArray(payload.users) ? payload.users.map(normalizeUser) : [],
      pagination: normalizePagination(payload.pagination),
    };
  },

  async createAdminUser(input: CreateUserInput): Promise<{ user: User }> {
    const payload = asRecord(
      await request(
        '/admin/users',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { user: normalizeUser(payload.user) };
  },

  async updateAdminUserRole(userId: string, input: UpdateUserRoleInput): Promise<{ user: User }> {
    const payload = asRecord(
      await request(
        `/admin/users/${userId}/role`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { user: normalizeUser(payload.user) };
  },

  async resetAdminUserPassword(userId: string, newPassword: string): Promise<MessageResponse> {
    const payload = asRecord(
      await request(
        `/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ newPassword }),
        },
        { auth: true },
      ),
    );
    return { message: asString(payload.message, 'Şifre sıfırlandı.') };
  },

  async deleteAdminUser(userId: string): Promise<MessageResponse> {
    const payload = asRecord(
      await request(
        `/admin/users/${userId}`,
        {
          method: 'DELETE',
        },
        { auth: true },
      ),
    );
    return { message: asString(payload.message, 'Kullanıcı silindi.') };
  },

  async getAdminMerchants(params: { q?: string; verified?: boolean } = {}): Promise<MerchantsResponse> {
    const query = buildQuery({
      q: params.q,
      verified: typeof params.verified === 'boolean' ? params.verified : undefined,
    });
    const payload = asRecord(await request(`/admin/merchants${query}`, {}, { auth: true }));
    return {
      merchants: Array.isArray(payload.merchants) ? payload.merchants.map(normalizeMerchant) : [],
    };
  },

  async createAdminMerchant(input: CreateMerchantInput): Promise<{ merchant: Merchant }> {
    const payload = asRecord(
      await request(
        '/admin/merchants',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { merchant: normalizeMerchant(payload.merchant) };
  },

  async updateAdminMerchant(merchantId: string, input: UpdateMerchantInput): Promise<{ merchant: Merchant }> {
    const payload = asRecord(
      await request(
        `/admin/merchants/${merchantId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { merchant: normalizeMerchant(payload.merchant) };
  },

  async getAdminExperiences(params: { merchantId?: string; q?: string } = {}): Promise<ExperiencesResponse> {
    const payload = asRecord(
      await request(`/admin/experiences${buildQuery(params)}`, {}, { auth: true }),
    );
    return {
      experiences: Array.isArray(payload.experiences) ? payload.experiences.map(normalizeExperience) : [],
    };
  },

  async createAdminExperience(input: CreateExperienceInput): Promise<{ experience: Experience }> {
    const payload = asRecord(
      await request(
        '/admin/experiences',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { experience: normalizeExperience(payload.experience) };
  },

  async updateAdminExperience(experienceId: string, input: UpdateExperienceInput): Promise<{ experience: Experience }> {
    const payload = asRecord(
      await request(
        `/admin/experiences/${experienceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { experience: normalizeExperience(payload.experience) };
  },

  async createAdminExperienceSlotsBulk(experienceId: string, input: CreateBulkSlotsInput): Promise<{ created: number }> {
    const payload = asRecord(
      await request(
        `/admin/experiences/${experienceId}/slots/bulk`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { created: asNumber(payload.created) };
  },

  async getAdminBookings(params: {
    status?: BookingStatus;
    merchantId?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsResponse> {
    const payload = asRecord(
      await request(`/admin/bookings${buildQuery(params)}`, {}, { auth: true }),
    );
    return {
      bookings: Array.isArray(payload.bookings) ? payload.bookings.map(normalizeBooking) : [],
      pagination: normalizePagination(payload.pagination),
    };
  },

  async updateAdminBookingStatus(bookingId: string, input: UpdateBookingStatusInput): Promise<{ booking: Booking }> {
    const payload = asRecord(
      await request(
        `/admin/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
        { auth: true },
      ),
    );
    return { booking: normalizeBooking(payload.booking) };
  },

  async getAdminAuditLogs(page = 1): Promise<AuditLogsResponse> {
    const payload = asRecord(
      await request(`/admin/audit-logs${buildQuery({ page })}`, {}, { auth: true }),
    );
    return {
      logs: Array.isArray(payload.logs) ? payload.logs.map((entry, index) => normalizeAuditLog(entry, index)) : [],
    };
  },
};
