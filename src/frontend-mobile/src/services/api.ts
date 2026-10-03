import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/v1'
  : 'https://api.yuanly.ai/v1';

// Token storage keys
const TOKEN_KEY = '@yuanly/auth_token';
const USER_KEY = '@yuanly/user_data';
const LANG_KEY = '@yuanly/language';

// Request helper
async function request<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get language preference
  const lang = await AsyncStorage.getItem(LANG_KEY);
  if (lang) {
    headers['Accept-Language'] = lang.toLowerCase();
  }

  // Attach auth token if required
  if (requiresAuth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || data.error || 'Request failed',
        errorCode: data.error_code,
        data: data,
      };
    }

    return data;
  } catch (error: any) {
    if (error.errorCode) throw error;
    throw { status: 0, message: 'Network error', errorCode: 'ERR_NETWORK' };
  }
}

// Auth API
export const authAPI = {
  wechatLogin: (wechat_token: string) =>
    request('/auth/wechat-login', 'POST', { wechat_token }, false),

  register: (data: { email?: string; phone?: string; fullName?: string; preferredLanguage?: string }) =>
    request('/auth/register', 'POST', data, false),

  verify2FA: (userId: string, code: string) =>
    request('/auth/verify-2fa', 'POST', { userId, code }, false),

  getProfile: () => request('/auth/me'),
  updateProfile: (data: any) => request('/auth/me', 'PUT', data),
  getNotifications: (unreadOnly?: boolean) =>
    request(`/auth/me/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  markNotificationRead: (id: string) =>
    request(`/auth/me/notifications/${id}/read`, 'PUT'),
};

// Experience API
export const experienceAPI = {
  explore: (params?: { vibe?: string; location?: string; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => v && query.append(k, String(v)));
    }
    return request(`/experiences/explore${query.toString() ? '?' + query.toString() : ''}`);
  },

  getDetail: (id: string) => request(`/experiences/${id}`),

  search: (q: string) => request(`/experiences/search?q=${encodeURIComponent(q)}`),

  trending: (limit?: number) => request(`/experiences/trending${limit ? '?limit=' + limit : ''}`),
};

// Booking API
export const bookingAPI = {
  list: (status?: string, page?: number) =>
    request(`/bookings${status ? '?status=' + status : ''}${page ? '&page=' + page : ''}`),

  getDetail: (id: string) => request(`/bookings/${id}`),

  holdSlot: (experienceId: string, slotId: string, guestCount?: number) =>
    request('/bookings/hold', 'POST', { experienceId, slotId, guestCount }),

  confirm: (bookingId: string, paymentRef: string) =>
    request('/bookings/confirm', 'POST', { bookingId, paymentRef }),

  cancel: (id: string, reason?: string) =>
    request(`/bookings/${id}/cancel`, 'POST', { reason }),

  getQR: (id: string) => request(`/bookings/${id}/qr`),
};

// Payment API
export const paymentAPI = {
  initiate: (bookingId: string, method: string) =>
    request('/payment/initiate', 'POST', { bookingId, method }),

  getStatus: (id: string) => request(`/payment/${id}/status`),

  refund: (id: string, reason?: string) =>
    request(`/payment/${id}/refund`, 'POST', { reason }),
};

// Slot API
export const slotAPI = {
  getAvailable: (experienceId: string, date?: string) =>
    request(`/slots/available?experienceId=${experienceId}${date ? '&date=' + date : ''}`),
};

// Review API
export const reviewAPI = {
  getByExperience: (experienceId: string, page?: number) =>
    request(`/reviews/experience/${experienceId}${page ? '?page=' + page : ''}`),

  getByUser: (userId: string) => request(`/reviews/user/${userId}`),

  create: (data: { bookingId: string; rating: number; comment?: string; mediaUrls?: string[] }) =>
    request('/reviews', 'POST', data),
};

// AI API — Dual-language responses (original + translation)
export const aiAPI = {
  interact: (text: string, language?: string, context?: any, voiceData?: string) =>
    request('/ai/interact', 'POST', { text, language, context, voiceData }),

  translate: (text: string, from?: string, to?: string) =>
    request('/ai/translate', 'POST', { text, from, to }),

  voice: (audioData: string, spokenLanguage?: string, userLanguage?: string, context?: any) =>
    request('/ai/voice', 'POST', { audioData, spokenLanguage, userLanguage, context }),

  recommend: (limit?: number) => request(`/ai/recommend${limit ? '?limit=' + limit : ''}`),
};

// Merchant API
export const merchantAPI = {
  list: (params?: { category?: string; location?: string; verified?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return request(`/merchants${query.toString() ? '?' + query.toString() : ''}`);
  },

  get: (id: string) => request(`/merchants/${id}`),

  register: (data: any) => request('/merchants/register', 'POST', data),

  update: (id: string, data: any) => request(`/merchants/${id}`, 'PUT', data),

  dashboard: (id: string) => request(`/merchants/${id}/dashboard`),

  createExperience: (merchantId: string, data: any) =>
    request(`/merchants/${merchantId}/experiences`, 'POST', data),

  updateExperience: (merchantId: string, expId: string, data: any) =>
    request(`/merchants/${merchantId}/experiences/${expId}`, 'PUT', data),

  deleteExperience: (merchantId: string, expId: string) =>
    request(`/merchants/${merchantId}/experiences/${expId}`, 'DELETE'),
};

// Token management
export const tokenManager = {
  save: async (token: string, user: any) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken: async () => AsyncStorage.getItem(TOKEN_KEY),

  getUser: async () => {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  clear: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  saveLanguage: async (lang: string) => {
    await AsyncStorage.setItem(LANG_KEY, lang);
  },

  getLanguage: async () => AsyncStorage.getItem(LANG_KEY),
};

export { API_BASE_URL };