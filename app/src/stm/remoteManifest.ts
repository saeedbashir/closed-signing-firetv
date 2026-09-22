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
import { STM_VERSIONS, type TitleManifest } from './types';

export type LoadResult =
  | { ok: true; manifest: TitleManifest }
  | { ok: false; reason: string };

/** Vega's media player refuses plain HTTP, so a manifest naming HTTP media is a dead end. */
const HTTPS = /^https:\/\//i;

/**
 * How long to wait before giving up.
 *
 * `fetch` has no timeout of its own, so a server that accepts the connection
 * and then says nothing leaves "Opening…" on screen for ever, with no way back
 * except leaving the app. Fifteen seconds is long enough for a slow connection
 * fetching a small JSON file and short enough that a viewer has not concluded
 * the television is broken.
 */
const TIMEOUT_MS = 15_000;

/**
 * Refuse a response larger than this.
 *
 * A manifest is a few kilobytes. Anything enormous is a wrong address — a video
 * file, a log, someone's backup — and parsing it as JSON on a television would
 * stall the screen or exhaust memory before failing.
 */
const MAX_BYTES = 2 * 1024 * 1024;

function validate(value: unknown): LoadResult {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, reason: 'That address did not return a manifest.' };
  }
  const m = value as Partial<TitleManifest>;
  if (!(STM_VERSIONS as readonly unknown[]).includes(m.stmVersion)) {
    return {
      ok: false,
      reason: m.stmVersion
        ? `That manifest is version ${String(m.stmVersion)}; this player reads ${STM_VERSIONS.join(' and ')}.`
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
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(trimmed, { signal: controller.signal });
    } catch {
      // An abort surfaces here as an ordinary rejection, so the flag is what
      // separates "the server never answered" from "there is no network".
      return timedOut
        ? { ok: false, reason: 'That address took too long to answer.' }
        : { ok: false, reason: 'Could not reach that address. Check the network.' };
    }
    if (!response.ok) {
      return { ok: false, reason: `That address returned ${response.status}.` };
    }

    // Refuse something enormous before reading it, when the server says how big.
    const declared = Number(response.headers?.get?.('content-length') ?? '');
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      return { ok: false, reason: 'That address is not a manifest; it is far too large.' };
    }

    let body: string;
    try {
      body = await response.text();
    } catch {
      return timedOut
        ? { ok: false, reason: 'That address took too long to answer.' }
        : { ok: false, reason: 'Could not read that address.' };
    }
    // And again once read, for servers that declare nothing.
    if (body.length > MAX_BYTES) {
      return { ok: false, reason: 'That address is not a manifest; it is far too large.' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return { ok: false, reason: 'That address returned something that is not a manifest.' };
    }
    return validate(parsed);
  } finally {
    clearTimeout(timer);
  }
}
