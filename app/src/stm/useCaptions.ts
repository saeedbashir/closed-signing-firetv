/**
 * Fetching and holding a caption track.
 *
 * Captions degrade rather than block. If the file will not load or will not
 * parse, the programme keeps playing and the plate stays empty — the same
 * principle the signer layer follows. A player that refuses to start because a
 * sidecar file 404'd would be a worse accessibility failure than the missing
 * captions.
 */
import { useEffect, useState } from 'react';
import { parseWebVtt, type Cue } from './webvtt';
import type { Caption } from './types';

export type CaptionState = {
  cues: readonly Cue[];
  status: 'idle' | 'loading' | 'ready' | 'failed';
};

const IDLE: CaptionState = { cues: [], status: 'idle' };

export function useCaptions(caption: Caption | null): CaptionState {
  const [state, setState] = useState<CaptionState>(IDLE);
  const url = caption?.url ?? null;

  useEffect(() => {
    if (!url) {
      setState(IDLE);
      return;
    }
    let cancelled = false;
    setState({ cues: [], status: 'loading' });

    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        const text = await response.text();
        if (cancelled) return;
        const cues = parseWebVtt(text);
        // A file that parsed to nothing is a failure worth showing as one,
        // not a track that is merely silent for an hour.
        setState({ cues, status: cues.length > 0 ? 'ready' : 'failed' });
      } catch {
        if (!cancelled) setState({ cues: [], status: 'failed' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

/**
 * The track for a caption mode, or null.
 *
 * Falls back to verbatim when simplified was asked for and does not exist,
 * because some text is better than none — and the caller can tell the
 * difference, since the returned track carries its own `kind`.
 */
export function trackForMode(
  captions: readonly Caption[],
  mode: 'off' | 'verbatim' | 'simplified',
): Caption | null {
  if (mode === 'off') return null;
  return captions.find((c) => c.kind === mode) ?? captions.find((c) => c.kind === 'verbatim') ?? null;
}

/**
 * Whether a track is machine-generated text that no human has checked.
 *
 * The format guarantees `reviewed: false` on generated tracks and only an
 * explicit review step naming a reviewer can set it true. The player says so
 * on screen: text that reads as authoritative but was produced by a model,
 * presented without qualification, is the thing that rule exists to prevent.
 */
export function isUnreviewed(caption: Caption | null): boolean {
  return caption?.generatedBy !== undefined && caption.reviewed !== true;
}
