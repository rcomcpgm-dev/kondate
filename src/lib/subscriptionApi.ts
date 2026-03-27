const API_BASE = '/api';

export async function createCheckoutSession(): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Checkout failed (${res.status})`);
  }
  return res.json();
}

export async function getSubscriptionStatus(
  params: { sessionId: string } | { customerId: string },
): Promise<{
  tier: 'free' | 'premium';
  token: string | null;
  expiresAt?: string;
  customerId?: string;
}> {
  const query =
    'sessionId' in params
      ? `session_id=${encodeURIComponent(params.sessionId)}`
      : `customer_id=${encodeURIComponent(params.customerId)}`;

  const res = await fetch(`${API_BASE}/subscription/status?${query}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Status check failed (${res.status})`);
  }
  return res.json();
}

export async function createPortalSession(
  customerId: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Portal failed (${res.status})`);
  }
  return res.json();
}
