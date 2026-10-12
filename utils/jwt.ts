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

// True when the token has expired or will within `leewaySeconds`.
export function isTokenExpired(token: string, leewaySeconds = 60): boolean {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== 'number') return true;
  return exp - leewaySeconds <= Date.now() / 1000;
}
