import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
};

export interface SubscriptionTokenPayload {
  customerId: string;
  subscriptionId: string;
  tier: 'premium';
  expiresAt: string;
}

export async function signSubscriptionToken(
  payload: SubscriptionTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(getSecret());
}

export async function verifySubscriptionToken(
  token: string,
): Promise<SubscriptionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.customerId === 'string' &&
      typeof payload.subscriptionId === 'string' &&
      payload.tier === 'premium' &&
      typeof payload.expiresAt === 'string'
    ) {
      return payload as unknown as SubscriptionTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
