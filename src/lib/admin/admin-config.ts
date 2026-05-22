// ============================================================
// AI API Relay — Admin Config Store (Vercel KV)
// ============================================================
// Runtime overrides for fallback chains and API keys.
// Falls back to source-code defaults when no KV override exists.

import { withTimeout } from '@/lib/utils/timeout';

let _kv: any = null;
let _kvChecked = false;

async function getKV() {
  if (_kvChecked) return _kv;
  _kvChecked = true;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv || mod.createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    return _kv;
  } catch {
    return null;
  }
}

// ── KV Key Prefixes ─────────────────────────────────────────
const PREFIX = {
  fallbacks: 'admin:fallbacks:',   // admin:fallbacks:{provider} → JSON string[]
  keys: 'admin:keys:',             // admin:keys:{provider} → JSON string[] (raw API keys)
  quota: 'admin:quota',            // admin:quota → Hash { dailyLimit, monthlyLimit }
} as const;

/**
 * Safely parses values retrieved from KV, handling both raw JSON strings
 * and automatically deserialized array values (which some KV clients return).
 */
function parseJsonOrArray(val: unknown): string[] | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === 'string');
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// ── Fallback Chain Management ────────────────────────────────

/**
 * Get the fallback chain for a provider.
 * Returns KV override if set, otherwise returns the static fallback from registry.
 */
export async function getFallbackChain(
  providerName: string,
  staticFallbacks?: string[] | string
): Promise<string[]> {
  if ((global as any).__mockFallbackChain) {
    return (global as any).__mockFallbackChain(providerName, staticFallbacks);
  }
  try {
    const kv = await getKV();
    if (kv) {
      const raw = await withTimeout(
        kv.get(`${PREFIX.fallbacks}${providerName}`),
        1000,
        null,
        `getFallbackChain:${providerName}`
      );
      if (raw) {
        const parsed = parseJsonOrArray(raw);
        if (parsed) return parsed;
      }
    }
  } catch {
    // fall through
  }
  // Return static fallback as single-element array, or array if already array, or empty
  if (Array.isArray(staticFallbacks)) return staticFallbacks;
  return staticFallbacks ? [staticFallbacks] : [];
}

/**
 * Set the fallback chain for a provider.
 * Pass empty array to clear all fallbacks.
 */
export async function setFallbackChain(
  providerName: string,
  chain: string[]
): Promise<void> {
  const kv = await getKV();
  if (!kv) {
    throw new Error('KV storage not configured — cannot persist fallback overrides');
  }
  await kv.set(`${PREFIX.fallbacks}${providerName}`, JSON.stringify(chain));
}

/**
 * Reset a provider's fallback chain to static defaults.
 */
export async function clearFallbackChain(providerName: string): Promise<void> {
  const kv = await getKV();
  if (!kv) return;
  await kv.del(`${PREFIX.fallbacks}${providerName}`);
}

// ── API Key Management ───────────────────────────────────────

/**
 * Get managed API keys for a provider.
 * Returns KV override if set, otherwise null (caller should use env vars).
 */
export async function getManagedKeys(providerName: string): Promise<string[] | null> {
  try {
    const kv = await getKV();
    if (kv) {
      const raw = await withTimeout(
        kv.get(`${PREFIX.keys}${providerName}`),
        1000,
        null,
        `getManagedKeys:${providerName}`
      );
      if (raw) {
        const parsed = parseJsonOrArray(raw);
        if (parsed) return parsed;
      }
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Get all managed keys for all providers (returns a map of provider → keys[]).
 */
export async function getAllManagedKeys(): Promise<Record<string, string[]>> {
  const kv = await getKV();
  if (!kv) return {};

  try {
    // Scan for all admin:keys:* keys
    const keys: string[] = [];
    let cursor = 0;
    do {
      const result = await withTimeout(
        kv.scan(cursor, { match: 'admin:keys:*', count: 100 }),
        1000,
        [0, []] as [number, string[]],
        'getAllManagedKeys:scan'
      );
      cursor = result[0];
      keys.push(...result[1]);
      if (cursor === 0 || result[1].length === 0) {
        break;
      }
    } while (cursor !== 0);

    const out: Record<string, string[]> = {};
    if (keys.length > 0) {
      const values = await withTimeout(
        Promise.all(keys.map((k: string) => kv.get(k))),
        1000,
        keys.map(() => null),
        'getAllManagedKeys:getValues'
      );
      for (let i = 0; i < keys.length; i++) {
        const provider = keys[i].replace('admin:keys:', '');
        if (values[i]) {
          const parsed = parseJsonOrArray(values[i]);
          if (parsed) {
            out[provider] = parsed;
          }
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Set the managed API keys for a provider.
 * This OVERRIDES env var keys for this provider when called.
 */
export async function setManagedKeys(
  providerName: string,
  keys: string[]
): Promise<void> {
  const kv = await getKV();
  if (!kv) {
    throw new Error('KV storage not configured — cannot persist key overrides');
  }
  await kv.set(`${PREFIX.keys}${providerName}`, JSON.stringify(keys));
}

/**
 * Add a key to a provider's managed key list.
 * If no managed keys exist yet, bootstraps from env var keys first.
 */
export async function addManagedKey(
  providerName: string,
  newKey: string,
  envKeys: string[] = []
): Promise<string[]> {
  const existing = await getManagedKeys(providerName);
  // Bootstrap from env if no managed keys yet
  const current = existing ?? [...envKeys];
  if (current.includes(newKey)) {
    return current; // already exists
  }
  current.push(newKey);
  await setManagedKeys(providerName, current);
  return current;
}

/**
 * Remove a key from a provider's managed key list.
 * Key can be matched by full value or by hash prefix.
 * If no managed keys exist, bootstraps from env keys first.
 */
export async function removeManagedKey(
  providerName: string,
  keyOrHash: string,
  envKeys: string[] = []
): Promise<string[]> {
  const existing = await getManagedKeys(providerName);
  const current = existing ?? [...envKeys];
  // Try matching by full value first, then by hash
  const filtered = current.filter((k) => k !== keyOrHash);
  if (filtered.length === current.length) {
    throw new Error(`Key not found: ${keyOrHash}`);
  }
  await setManagedKeys(providerName, filtered);
  return filtered;
}

// ── Quota Limit Override Management ─────────────────────────

export interface CustomQuotaConfig {
  dailyLimit: number | null;
  monthlyLimit: number | null;
}

/**
 * Get custom quota override limits from KV.
 * Returns null if no custom quota override is configured.
 */
export async function getCustomQuota(): Promise<CustomQuotaConfig | null> {
  try {
    const kv = await getKV();
    if (kv) {
      const raw = await withTimeout<Record<string, unknown> | null>(
        kv.hgetall(PREFIX.quota),
        1000,
        null,
        'getCustomQuota'
      );
      if (raw && (raw.dailyLimit !== undefined || raw.monthlyLimit !== undefined)) {
        return {
          dailyLimit: raw.dailyLimit !== null && raw.dailyLimit !== undefined && raw.dailyLimit !== '' ? parseInt(String(raw.dailyLimit), 10) : null,
          monthlyLimit: raw.monthlyLimit !== null && raw.monthlyLimit !== undefined && raw.monthlyLimit !== '' ? parseInt(String(raw.monthlyLimit), 10) : null,
        };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Set custom quota override limits in KV.
 */
export async function setCustomQuota(quota: CustomQuotaConfig): Promise<void> {
  const kv = await getKV();
  if (!kv) {
    throw new Error('KV storage not configured — cannot persist quota overrides');
  }
  await kv.hset(PREFIX.quota, {
    dailyLimit: quota.dailyLimit === null ? '' : String(quota.dailyLimit),
    monthlyLimit: quota.monthlyLimit === null ? '' : String(quota.monthlyLimit),
  });
}

/**
 * Clear custom quota overrides and revert to environment variables.
 */
export async function clearCustomQuota(): Promise<void> {
  const kv = await getKV();
  if (!kv) return;
  await kv.del(PREFIX.quota);
}
