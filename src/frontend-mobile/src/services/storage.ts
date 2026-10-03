import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/api';

const TOKEN_KEY = '@yuanly/auth-token';
const USER_KEY = '@yuanly/auth-user';
const LANGUAGE_KEY = '@yuanly/language';
const FALLBACK_SUFFIX = ':fallback';

let secureAvailabilityPromise: Promise<boolean> | null = null;

async function isSecureStoreAvailable() {
  if (!secureAvailabilityPromise) {
    secureAvailabilityPromise = SecureStore.isAvailableAsync().catch(() => false);
  }

  return secureAvailabilityPromise;
}

async function setSecureValue(key: string, value: string) {
  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(`${key}${FALLBACK_SUFFIX}`);
      return;
    } catch {
      // Fallback handled below.
    }
  }

  await AsyncStorage.setItem(`${key}${FALLBACK_SUFFIX}`, value);
}

async function getSecureValue(key: string) {
  if (await isSecureStoreAvailable()) {
    try {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue !== null) {
        return secureValue;
      }
    } catch {
      // Fall through to AsyncStorage.
    }
  }

  return AsyncStorage.getItem(`${key}${FALLBACK_SUFFIX}`);
}

async function deleteSecureValue(key: string) {
  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore secure delete failures and clean fallback storage below.
    }
  }

  await AsyncStorage.removeItem(`${key}${FALLBACK_SUFFIX}`);
}

export const sessionStorage = {
  async saveSession(token: string, user: User) {
    await Promise.all([setSecureValue(TOKEN_KEY, token), setSecureValue(USER_KEY, JSON.stringify(user))]);
  },
  async getToken() {
    return getSecureValue(TOKEN_KEY);
  },
  async getUser() {
    const storedUser = await getSecureValue(USER_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      await deleteSecureValue(USER_KEY);
      return null;
    }
  },
  async clearSession() {
    await Promise.all([deleteSecureValue(TOKEN_KEY), deleteSecureValue(USER_KEY)]);
  },
};

export async function getStoredLanguage() {
  return AsyncStorage.getItem(LANGUAGE_KEY);
}

export async function setStoredLanguage(language: string) {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
