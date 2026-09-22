/**
 * Persistence, and what to do when it fails.
 *
 * Nothing was persisted before this: preferences reset on every launch, so the
 * first-run walkthrough greeted the viewer every time and "resume where you
 * left off" resumed nowhere. For an app whose whole premise is *your* choice of
 * layout being remembered, that was the premise quietly not working.
 *
 * Every read and write is wrapped. Storage on a television can fail — a full
 * disk, a corrupt value written by an older build — and none of those are worth
 * taking the screen down for. A failed read gives you the fallback; a failed
 * write is dropped. The viewer loses a preference, not the programme.
 */
import { AsyncStorage } from '@amazon-devices/react-native-kepler/Libraries/Storage/AsyncStorage';

const PREFIX = 'closed-signing/';

/** Read and parse a stored value, or the fallback if anything goes wrong. */
export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Store a value. Returns whether it stuck, for callers that care. */
export async function save(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
