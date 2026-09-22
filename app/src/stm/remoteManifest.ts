/**
 * Loading a Signed Track Manifest from a URL the viewer typed.
 *
 * This is what turns the app from a player for three videos we prepared into a
 * player for the format. Anyone can run the pipeline over their own content,
 * publish the manifest anywhere, and point this at it.
 *
 * Which means the input is untrusted, and every failure has to say something a
 * person can act on. "Something went wrong" is useless to a viewer holding a
 * remote in front of a television; "that address returned a web page, not a
 * manifest" tells them they pasted the wrong link.
 */
import type { TitleManifest } from './types';

export type LoadResult =
  | { ok: true; manifest: TitleManifest }
  | { ok: false; reason: string };

/** Vega's media player refuses plain HTTP, so a manifest naming HTTP media is a dead end. */
const HTTPS = /^https:\/\//i;

function validate(value: unknown): LoadResult {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, reason: 'That address did not return a manifest.' };
  }
  const m = value as Partial<TitleManifest>;
  if (m.stmVersion !== '0.1') {
    return {
      ok: false,
      reason: m.stmVersion
        ? `That manifest is version ${String(m.stmVersion)}; this player reads 0.1.`
        : 'That file is not a Signed Track Manifest.',
    };
  }
  if (!m.id || !m.title) return { ok: false, reason: 'That manifest has no title.' };
  const main = m.video?.main?.url;
  if (!main) return { ok: false, reason: 'That manifest has no main video.' };
  if (!HTTPS.test(main)) {
    // Worth naming precisely: it is the commonest way a valid manifest still
    // will not play here, and the media error alone reads like a codec fault.
    return { ok: false, reason: 'That manifest points at plain HTTP. Fire TV needs HTTPS.' };
  }
  if (!Array.isArray(m.signLanguage) || m.signLanguage.length === 0) {
    return { ok: false, reason: 'That manifest has no sign language track.' };
  }
  return { ok: true, manifest: m as TitleManifest };
}

/** Fetch and validate a manifest. Never throws. */
export async function loadManifest(url: string): Promise<LoadResult> {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, reason: 'Enter an address first.' };
  if (!HTTPS.test(trimmed)) {
    return { ok: false, reason: 'The address must start with https://' };
  }
  // Typed by inference rather than by name: the lint environment has no DOM
  // globals, and `fetch` is provided by the React Native runtime.
  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(trimmed);
  } catch {
    return { ok: false, reason: 'Could not reach that address. Check the network.' };
  }
  if (!response.ok) {
    return { ok: false, reason: `That address returned ${response.status}.` };
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return { ok: false, reason: 'That address returned something that is not a manifest.' };
  }
  return validate(parsed);
}
