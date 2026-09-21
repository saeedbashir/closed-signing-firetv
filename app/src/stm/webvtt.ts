/**
 * WebVTT, as it actually arrives rather than as the specification describes it.
 *
 * The files we have are real broadcast captions, and they carry things a
 * textbook parser trips over: cue settings after the timing line
 * (`align:start position:0%`), inline karaoke markup
 * (`i<00:00:10.719><c> have</c>`), cues whose body is a single space, and
 * rolling captions where each cue repeats the previous line plus a few new
 * words.
 *
 * The rule here is that a malformed cue is skipped and the rest of the file
 * still plays. Captions failing closed — one bad timestamp and the viewer gets
 * nothing for the whole programme — is the worst outcome for the people this
 * app exists for.
 */

export type Cue = {
  startMs: number;
  endMs: number;
  text: string;
};

/** `HH:MM:SS.mmm` or `MM:SS.mmm`, which the specification allows. */
const TIMESTAMP = /^(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})$/;

const TIMING = /^(\S+)\s*-->\s*(\S+)(?:\s+(.*))?$/;

/** Milliseconds for one WebVTT timestamp, or null if it is not one. */
export function parseTimestamp(raw: string): number | null {
  const m = TIMESTAMP.exec(raw.trim());
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  return (
    (h ? Number(h) * 3_600_000 : 0) + Number(mm) * 60_000 + Number(ss) * 1000 + Number(ms)
  );
}

/**
 * Strip the markup a cue body may carry.
 *
 * Inline timestamps and `<c>` spans are how some encoders paint words in as
 * they are spoken. We render a cue at a time, so the tags are noise — but the
 * *text* between them is the caption, and dropping it would silently lose most
 * of the words.
 */
export function stripCueMarkup(body: string): string {
  return body
    .replace(/<[^>]*>/g, '')
    .replace(/&lrm;|&rlm;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

/**
 * Parse a WebVTT file into cues, in start order.
 *
 * Blocks that are not cues — the WEBVTT header, NOTE, STYLE, REGION — are
 * skipped. Cues whose body is empty after stripping markup are dropped too:
 * they exist in rolling captions as spacers and would otherwise blank the
 * plate mid-sentence.
 */
export function parseWebVtt(input: string): Cue[] {
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const cues: Cue[] = [];

  for (const block of text.split(/\n{2,}/)) {
    if (!block.trim()) continue;
    const lines = block.split('\n');

    // The timing line is not always first: a cue may be preceded by an
    // identifier, and we do not care what that identifier is.
    const at = lines.findIndex((line) => TIMING.test(line.trim()));
    if (at === -1) continue;

    const m = TIMING.exec(lines[at].trim());
    if (!m) continue;
    const startMs = parseTimestamp(m[1]);
    const endMs = parseTimestamp(m[2]);
    if (startMs === null || endMs === null) continue;
    if (endMs <= startMs) continue;

    const body = stripCueMarkup(lines.slice(at + 1).join('\n'));
    if (!body) continue;

    cues.push({ startMs, endMs, text: body });
  }

  cues.sort((a, b) => a.startMs - b.startMs);
  return cues;
}

/**
 * The cue showing at a given time, or null.
 *
 * Binary search, because this runs several times a second against files that
 * can hold thousands of cues for an hour of proceedings.
 *
 * Where cues overlap — which rolling captions do constantly — the latest one
 * that has started wins, so the text moves forward rather than flickering
 * between an old cue and its successor.
 */
export function activeCue(cues: readonly Cue[], timeMs: number): Cue | null {
  let lo = 0;
  let hi = cues.length - 1;
  let best: Cue | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (cue.startMs <= timeMs) {
      if (timeMs < cue.endMs) best = cue;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
