import { API_BASE_URL } from './config';
import { getStoredLanguage, sessionStorage } from './storage';
import { Language, translateText } from '../i18n/translations';
import { BookingStatus, LanguageCode, User } from '../types/api';

export type AuthMode = 'none' | 'optional' | 'required';

type UnauthorizedHandler = () => Promise<void> | void;

const ERROR_TRANSLATION_KEYS: Record<string, string> = {
  ERR_NETWORK: 'common.networkError',
  ERR_INVALID_CREDENTIALS: 'auth.invalidCredentials',
  ERR_EMAIL_TAKEN: 'auth.emailTaken',
  ERR_SLOT_TAKEN: 'booking.slotTaken',
  ERR_CAPACITY_FULL: 'booking.capacityFull',
  ERR_INVALID_TRANSITION: 'merchant.invalidTransition',
  ERR_UNAUTHENTICATED: 'auth.signInRequiredMessage',
};

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  details?: unknown;

  constructor(status: number, message: string, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setApiUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function normalizeLanguage(value: string | null | undefined): Language {
  if (value === 'CN' || value === 'EN' || value === 'TR') {
    return value;
  }

  return 'EN';
}

async function getCurrentLanguage() {
  return normalizeLanguage(await getStoredLanguage());
}

function getAcceptLanguage(language: Language) {
  if (language === 'CN') {
    return 'zh';
  }

  return language.toLowerCase();
}

function localizeErrorMessage(language: Language, errorCode?: string, fallback?: string, status?: number) {
  const translationKey = errorCode ? ERROR_TRANSLATION_KEYS[errorCode] : undefined;
  if (translationKey) {
    return translateText(language, translationKey);
  }

  if (status === 401) {
    return translateText(language, 'errors.unauthorized');
  }

  if (status === 403) {
    return fallback || translateText(language, 'errors.forbidden');
  }

  return fallback || translateText(language, 'common.error');
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function parseResponseBody(rawBody: string, contentType: string | null) {
  if (!rawBody) {
    return null;
  }

  const looksLikeJson = contentType?.includes('application/json') || rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[');

  if (!looksLikeJson) {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  authMode?: AuthMode;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authMode = 'none' } = options;
  const language = await getCurrentLanguage();
  const token = await sessionStorage.getToken();

  if (authMode === 'required' && !token) {
    throw new ApiError(401, translateText(language, 'auth.signInRequiredMessage'), 'ERR_UNAUTHENTICATED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getAcceptLanguage(language),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && authMode !== 'none') {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const rawBody = await response.text();
    const parsedBody = parseResponseBody(rawBody, response.headers.get('content-type'));

    if (!response.ok) {
      const errorCode = typeof parsedBody === 'object' && parsedBody !== null ? (parsedBody as any).error_code : undefined;
      const fallbackMessage =
        typeof parsedBody === 'object' && parsedBody !== null
          ? (parsedBody as any).error || (parsedBody as any).message
          : typeof parsedBody === 'string'
            ? parsedBody
            : undefined;

      if (response.status === 401 && token && authMode !== 'none') {
        await unauthorizedHandler?.();
      }

      throw new ApiError(
        response.status,
        localizeErrorMessage(language, errorCode, fallbackMessage, response.status),
        errorCode,
        parsedBody,
      );
    }

    return (parsedBody ?? {}) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, translateText(language, 'common.networkError'), 'ERR_NETWORK');
    }

    throw new ApiError(0, translateText(language, 'common.networkError'), 'ERR_NETWORK');
  } finally {
    clearTimeout(timeout);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: data }),
  register: (data: { email: string; password: string; fullName: string; preferredLanguage: LanguageCode }) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: data }),
  getMe: () => request<{ user: User }>('/auth/me', { authMode: 'required' }),
  updateMe: (data: Partial<Pick<User, 'fullName' | 'phone' | 'preferredLanguage' | 'travelStyle'>>) =>
    request<{ user: User }>('/auth/me', { method: 'PUT', body: data, authMode: 'required' }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: data, authMode: 'required' }),
  deleteMe: (data: { password: string }) =>
    request<{ message: string }>('/auth/me', { method: 'DELETE', body: data, authMode: 'required' }),
  getNotifications: (unreadOnly?: boolean) =>
    request<{ notifications: any[]; unreadCount: number }>(`/auth/me/notifications${buildQuery({ unreadOnly })}`, { authMode: 'required' }),
  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/auth/me/notifications/${id}/read`, { method: 'PUT', authMode: 'required' }),
};

export const experienceAPI = {
  explore: (params?: { vibe?: string; location?: string; category?: string; sort?: string; page?: number; limit?: number }) =>
    request<{ experiences: any[]; pagination?: any }>(`/experiences/explore${buildQuery(params)}`),
  search: (query: string) =>
    request<{ experiences: any[]; query: string; count: number }>(`/experiences/search${buildQuery({ q: query })}`),
  getDetail: (id: string) => request<{ experience: any }>(`/experiences/${id}`),
  getAvailableSlots: (experienceId: string, date?: string) =>
    request<{ slots: any[]; count: number }>(`/slots/available${buildQuery({ experienceId, date })}`),
};

export const bookingAPI = {
  create: (data: { experienceId: string; slotId: string; guestCount: number; guestName?: string; guestPhone?: string; notes?: string }) =>
    request<{ booking: any }>('/bookings', { method: 'POST', body: data, authMode: 'required' }),
  list: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    request<{ bookings: any[]; pagination?: any }>(`/bookings${buildQuery(params)}`, { authMode: 'required' }),
  getById: (id: string) => request<{ booking: any }>(`/bookings/${id}`, { authMode: 'required' }),
  cancel: (id: string, reason?: string) =>
    request<{ booking: any }>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason }, authMode: 'required' }),
  getQr: (id: string) => request<{ qrCode: string; booking: any }>(`/bookings/${id}/qr`, { authMode: 'required' }),
};

export const merchantAPI = {
  getMe: () => request<any>('/merchant/me', { authMode: 'required' }),
  listBookings: (params?: { status?: BookingStatus; scope?: 'upcoming' | 'past'; date?: string; page?: number; limit?: number }) =>
    request<{ bookings: any[]; pagination?: any; counts?: Record<string, number> }>(`/merchant/bookings${buildQuery(params)}`, {
      authMode: 'required',
    }),
  createBooking: (data: {
    experienceId: string;
    startTime: string;
    guestCount: number;
    guestName: string;
    guestPhone?: string;
    notes?: string;
    status?: 'CONFIRMED' | 'PENDING';
  }) => request<{ booking: any }>('/merchant/bookings', { method: 'POST', body: data, authMode: 'required' }),
  updateBookingStatus: (id: string, data: { status: BookingStatus; reason?: string }) =>
    request<{ booking: any }>(`/merchant/bookings/${id}/status`, { method: 'PUT', body: data, authMode: 'required' }),
};

export const aiAPI = {
  interact: (data: { text: string; language?: string; context?: unknown }) =>
    request<{ intent?: string; userLanguage?: string; message?: any; data?: any; timestamp?: string }>('/ai/interact', {
      method: 'POST',
      body: data,
      authMode: 'optional',
    }),
};
