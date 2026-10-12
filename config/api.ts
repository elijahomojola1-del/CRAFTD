import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // A published app or website sets EXPO_PUBLIC_API_URL to the live server,
  // e.g. in a .env file: EXPO_PUBLIC_API_URL=https://api.example.com
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  // Local development: the backend runs on this machine.
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost?.split(':')[0];

  if (ip) {
    return `http://${ip}:8000`;
  }

  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
