import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Hard rate limit: 100 requests per IP per 24h (abuse prevention)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// ---------------------------------------------------------------------------
// Gacha limit: 10 requests on the first day an IP is seen, then 5/day.
// Tracked separately from the hard rate limit above.
// TODO: When Stripe is integrated, premium users will pass a session token
//       (e.g. via Authorization header) to bypass the gacha limit entirely.
// ---------------------------------------------------------------------------
interface GachaEntry {
  count: number;
  resetAt: number;
  firstSeenAt: number;
}

const gachaMap = new Map<string, GachaEntry>();

const GACHA_FIRST_DAY_LIMIT = 10;
const GACHA_DAILY_LIMIT = 5;

function getGachaLimitInfo(ip: string): { allowed: boolean; remaining: number; limit: number } {
  const now = Date.now();
  const entry = gachaMap.get(ip);

  if (!entry) {
    // First request ever from this IP
    gachaMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS, firstSeenAt: now });
    return { allowed: true, remaining: GACHA_FIRST_DAY_LIMIT - 1, limit: GACHA_FIRST_DAY_LIMIT };
  }

  const isFirstDay = now < entry.firstSeenAt + RATE_WINDOW_MS;
  const dailyLimit = isFirstDay ? GACHA_FIRST_DAY_LIMIT : GACHA_DAILY_LIMIT;

  // Reset the daily window if it has elapsed (keep firstSeenAt intact)
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_WINDOW_MS;
    return { allowed: true, remaining: dailyLimit - 1, limit: dailyLimit };
  }

  if (entry.count >= dailyLimit) {
    return { allowed: false, remaining: 0, limit: dailyLimit };
  }

  entry.count += 1;
  return { allowed: true, remaining: dailyLimit - entry.count, limit: dailyLimit };
}

async function isPremiumRequest(req: VercelRequest): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const { verifySubscriptionToken } = await import('./lib/jwt.js');
    const payload = await verifySubscriptionToken(token);
    return payload !== null;
  } catch {
    return false;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Rate limiting by IP
  const ip =
    (Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']?.split(',')[0]?.trim()) ||
    req.socket.remoteAddress ||
    'unknown';

  // Hard rate limit (abuse prevention) — applies to everyone
  const { allowed, remaining } = getRateLimitInfo(ip);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(remaining));

  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    return;
  }

  // Premium users bypass gacha daily limit (but not hard rate limit)
  const premium = await isPremiumRequest(req);

  if (!premium) {
    // Gacha daily limit (free-tier throttle)
    const gacha = getGachaLimitInfo(ip);
    res.setHeader('X-Gacha-Limit', String(gacha.limit));
    res.setHeader('X-Gacha-Remaining', String(gacha.remaining));

    if (!gacha.allowed) {
      res.status(429).json({ error: 'Daily generation limit reached. Try again tomorrow.' });
      return;
    }
  }

  // Validate request body
  const { system, messages, model } = req.body ?? {};

  if (!system || !messages || !model) {
    res.status(400).json({
      error: 'Missing required fields: system, messages, model',
    });
    return;
  }

  // Model whitelist — prevent abuse via expensive models
  const ALLOWED_MODELS = ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
  if (!ALLOWED_MODELS.includes(model)) {
    res.status(400).json({ error: 'Invalid model specified' });
    return;
  }

  // Forward to Anthropic API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: API key not set' });
    return;
  }

  try {
    const anthropicResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ system, messages, model, max_tokens: 2048 }),
      },
    );

    const data = await anthropicResponse.json();

    res.status(anthropicResponse.status).json(data);
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(502).json({ error: 'Upstream API error' });
  }
}
