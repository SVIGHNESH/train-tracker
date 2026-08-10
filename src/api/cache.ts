import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistent response cache. The RapidAPI free tiers have tiny quotas, so
// every avoidable request matters. Values are stored with a timestamp and
// served until their TTL expires.

interface Entry<T> {
  t: number;
  v: T;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const storageKey = `cache:${key}`;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const entry: Entry<T> = JSON.parse(raw);
      if (Date.now() - entry.t < ttlMs) return entry.v;
    }
  } catch {
    // corrupt cache entry - ignore and refetch
  }
  const value = await fetcher();
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    // storage full or unavailable - serving uncached is fine
  }
  return value;
}
