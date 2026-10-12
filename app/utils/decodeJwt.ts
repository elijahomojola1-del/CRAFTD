import { decodeJwtPayload } from '../../utils/jwt';
import { getToken } from '../../utils/tokenStorage';

export { decodeJwtPayload };

export async function getCurrentUserId(): Promise<number | null> {
  const token = await getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.user_id ?? null;
}
