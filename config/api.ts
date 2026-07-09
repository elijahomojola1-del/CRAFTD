import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost?.split(':')[0];

  if (ip) {
    return `http://${ip}:8000`;
  }

  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();