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
 *
 * Backed by `@amazon-devices/react-native-async-storage__async-storage`, the
 * package the Kepler fork's own `AsyncStorage` tells you to migrate to. It is a
 * system distributed library: the module id in its `kepler-compatibility.json`
 * has to be declared under `[needs.module]` in `manifest.toml`, or the
 * TurboModule is simply absent at runtime.
 */
import AsyncStorage from '@amazon-devices/react-native-async-storage__async-storage';

const PREFIX = 'closed-signing/';

/**
 * The last thing storage said when it failed, or null.
 *
 * Swallowing every error is the right behaviour for the viewer and the wrong
 * one for whoever is trying to find out why nothing persists — which is what
 * happened: the legacy `AsyncStorage` in the Kepler fork binds to a native
 * module that is not there, its `invariant` threw, `load` and `save` caught it,
 * and every launch quietly started from the defaults. The message is kept so a
 * diagnostic build can put it on screen, where on this platform things can be
 * seen. See friction-log/006.
 */
let lastError: string | null = null;
export const lastStorageError = (): string | null => lastError;

const note = (e: unknown): void => {
  lastError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
};

/** Read and parse a stored value, or the fallback if anything goes wrong. */
export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    note(e);
    return fallback;
  }
}

/** Store a value. Returns whether it stuck, for callers that care. */
export async function save(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    note(e);
    return false;
  }
}
