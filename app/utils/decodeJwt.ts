// Minimal base64url JWT payload decoder — no atob/Buffer dependency,
// so it works in the RN/Hermes environment without extra polyfills.
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';

  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const char of str) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const decoded = base64UrlDecode(payloadPart);
    return JSON.parse(decoded);
  } catch (err) {
    console.log('decodeJwtPayload error:', err);
    return null;
  }
}

export async function getCurrentUserId(): Promise<number | null> {
  const SecureStore = await import('expo-secure-store');
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.user_id ?? null;
}