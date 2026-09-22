/**
 * Addresses the viewer has opened before.
 *
 * Typing a URL with a remote is miserable, so the honest design is to make it
 * happen once. Everything after that is a list you arrow down to. Recents are
 * not a convenience here, they are what makes the feature usable at all.
 */
import { load, save } from './storage';

export type Recent = {
  url: string;
  title: string;
  /** Epoch ms, so the list can be ordered without storing an index. */
  openedAt: number;
};

const KEY = 'recents';

/** Keep the list short: a television list the viewer scrolls is a list they will not read. */
export const MAX_RECENTS = 8;

export const loadRecents = (): Promise<Recent[]> => load<Recent[]>(KEY, []);

/**
 * Put an address at the top, newest first, without duplicating it.
 *
 * Pure, so the ordering rules are testable without touching storage.
 */
export function withRecent(existing: readonly Recent[], entry: Recent): Recent[] {
  const others = existing.filter((r) => r.url !== entry.url);
  return [entry, ...others].slice(0, MAX_RECENTS);
}

/** Record an address that played, and return the new list. */
export async function rememberRecent(url: string, title: string): Promise<Recent[]> {
  const next = withRecent(await loadRecents(), { url, title, openedAt: Date.now() });
  await save(KEY, next);
  return next;
}
