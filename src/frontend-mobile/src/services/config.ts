import Constants from 'expo-constants';

const DEV_FALLBACK_API_URL = 'http://localhost:5000/v1';
const PRODUCTION_PLACEHOLDER_API_URL = 'https://REPLACE_ME_API_HOST/v1';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function ensureV1Suffix(value: string) {
  const normalizedValue = trimTrailingSlash(value);
  return normalizedValue.endsWith('/v1') ? normalizedValue : `${normalizedValue}/v1`;
}

function isRealConfiguredUrl(value: string | undefined | null) {
  return Boolean(value && !value.includes('REPLACE_ME_API_HOST'));
}

function isHttps(value: string) {
  return value.startsWith('https://');
}

const configuredApiUrl = [process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.extra?.apiUrl]
  .map((value) => (typeof value === 'string' ? value.trim() : ''))
  .find(Boolean);

const normalizedConfiguredApiUrl = configuredApiUrl ? ensureV1Suffix(configuredApiUrl) : '';

let resolvedApiUrl = normalizedConfiguredApiUrl;

if (__DEV__) {
  resolvedApiUrl = isRealConfiguredUrl(normalizedConfiguredApiUrl)
    ? normalizedConfiguredApiUrl
    : DEV_FALLBACK_API_URL;
} else if (!isRealConfiguredUrl(normalizedConfiguredApiUrl) || !isHttps(normalizedConfiguredApiUrl)) {
  resolvedApiUrl = PRODUCTION_PLACEHOLDER_API_URL;
}

export const API_BASE_URL = resolvedApiUrl;
export const API_ORIGIN = trimTrailingSlash(API_BASE_URL).replace(/\/v1$/, '');
