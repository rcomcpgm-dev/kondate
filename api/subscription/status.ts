import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { SignJWT } from 'jose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Inline JWT signing (avoids cross-directory import issues on Vercel)
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

async function signToken(payload: {
  customerId: string;
  subscriptionId: string;
  tier: 'premium';
  expiresAt: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(getJwtSecret());
}

// Inline rate limit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: VercelRequest, max: number, windowMs: number): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, 10, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const sessionId = req.query.session_id as string | undefined;
  const customerId = req.query.customer_id as string | undefined;

  try {
    let subscription: Stripe.Subscription | null = null;
    let stripeCustomerId: string | null = null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });
      subscription = session.subscription as Stripe.Subscription | null;
      stripeCustomerId = session.customer as string;
    } else if (customerId) {
      stripeCustomerId = customerId;
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      subscription = subs.data[0] || null;
    } else {
      return res.status(400).json({ error: 'session_id or customer_id required' });
    }

    if (!subscription || subscription.status !== 'active') {
      return res.status(200).json({ tier: 'free', token: null });
    }

    const periodEnd = subscription.items.data[0]?.current_period_end;
    const expiresAt = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const token = await signToken({
      customerId: stripeCustomerId!,
      subscriptionId: subscription.id,
      tier: 'premium',
      expiresAt,
    });

    return res.status(200).json({
      tier: 'premium',
      token,
      expiresAt,
      customerId: stripeCustomerId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
