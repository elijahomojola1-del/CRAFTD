import { decodeJwtPayload } from './jwt';
import { getToken } from './tokenStorage';

export { decodeJwtPayload };

export async function getCurrentUserId(): Promise<number | null> {
  const token = await getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.user_id ?? null;
}
