import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { isTokenExpired } from './jwt';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// expo-secure-store has no web implementation, so web falls back to localStorage.
export async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function writeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(access: string, refresh?: string): Promise<void> {
  await writeItem(ACCESS_KEY, access);
  if (refresh) {
    await writeItem(REFRESH_KEY, refresh);
  }
}

export async function clearToken(): Promise<void> {
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}

// Several screens ask for the token at once; they share one refresh request.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await readItem(REFRESH_KEY);
  if (!refresh || isTokenExpired(refresh, 0)) {
    await clearToken();
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    // Offline or server unreachable: stay signed in and let the caller's
    // own request fail, rather than logging the user out.
    return readItem(ACCESS_KEY);
  }

  if (!response.ok) {
    await clearToken();
    return null;
  }

  const data = await response.json();
  await saveTokens(data.access, data.refresh);
  return data.access;
}

// Returns a usable access token, renewing it first when it has run out.
// Returns null when the user is signed out or the session can't be renewed.
export async function getToken(): Promise<string | null> {
  const access = await readItem(ACCESS_KEY);
  if (access && !isTokenExpired(access)) {
    return access;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
