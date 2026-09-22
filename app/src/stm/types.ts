/**
 * TypeScript view of the Signed Track Manifest, version 0.1.
 *
 * Mirrors the JSON Schema in the signed-track-manifest repository. Kept as
 * hand-written types rather than generated ones so the comments explaining
 * *why* a field exists travel with the app, where the player author reads them.
 */

export type Provenance = 'human-interpreter' | 'synthesised';
export type SourceLayout = 'corner-inset' | 'side-panel';
export type ExtractionMethod = 'detected-crop' | 'manual-crop';
export type FillMethod = 'none' | 'interpolated-surround' | 'blurred-surround';
export type CaptionKind = 'verbatim' | 'simplified';

/** Below this, a player should badge the title rather than hide the doubt. */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export type Rect = { x: number; y: number; w: number; h: number };

export type VideoAsset = {
  url: string;
  width: number;
  height: number;
  codec: 'h264' | 'hevc' | 'vp9' | 'av1';
};

export type Source = {
  publisher: string;
  url: string;
  licence: string;
  /** Displayed on the title detail screen, not buried in a footer. */
  attribution: string;
  productionCredit?: string;
  acquisitionRoute?: string;
};

export type Extraction = {
  method: ExtractionMethod;
  sourceLayout: SourceLayout;
  /** 0..1, public on purpose so consumers can set their own threshold. */
  confidence: number;
  cropRect: Rect;
  fillMethod: FillMethod;
};

/**
 * How much the interpreter moves, per interval from t=0. Format 0.2.
 *
 * Integers 0..100, normalised to the title's own 95th percentile. Hand motion
 * and nothing else — not meaning, not quality. The idle threshold is ours to
 * set, exactly as the low-confidence threshold is.
 */
export type Activity = {
  intervalMs: number;
  scale: 'title-p95';
  values: number[];
};

export type SignTrack = {
  /** ISO 639-3. `ase` is American Sign Language, `bfi` British. */
  language: string;
  languageLabel: string;
  /**
   * Required, no default. Whether a human produced this signing.
   *
   * This is the most important field in the format. A player must never let a
   * synthesised track pass as a human one, which is why it cannot be omitted
   * and cannot be inferred.
   */
  provenance: Provenance;
  extraction?: Extraction;
  generatedBy?: string;
  track: VideoAsset & {
    /** Interpretation lags speech; the player shifts, the pipeline never re-encodes. */
    syncOffsetMs: number;
  };
  /** Absent on 0.1 manifests and on titles the producer did not measure. */
  activity?: Activity;
};

export type Caption = {
  kind: CaptionKind;
  language: string;
  url: string;
  format: 'webvtt';
  generatedBy?: string;
  /** Machine-generated text is published false. Honest labelling, not a flag. */
  reviewed?: boolean;
  reviewedBy?: string;
};

/** The versions this player reads. 0.2 adds `activity`; nothing else changed. */
export const STM_VERSIONS = ['0.1', '0.2'] as const;
export type StmVersion = (typeof STM_VERSIONS)[number];

export type TitleManifest = {
  stmVersion: StmVersion;
  id: string;
  title: string;
  durationMs: number;
  source: Source;
  video: { main: VideoAsset; poster: string };
  signLanguage: SignTrack[];
  captions: Caption[];
};

export type CatalogueEntry = {
  id: string;
  title: string;
  durationMs: number;
  poster: string;
  manifestUrl: string;
  signLanguages: string[];
  confidence?: number;
};

export type Catalogue = { stmVersion: StmVersion; titles: CatalogueEntry[] };

/** Only ever show a human-interpreted track. We do not play synthesised signing. */
export function humanSignTracks(m: TitleManifest): SignTrack[] {
  return m.signLanguage.filter((t) => t.provenance === 'human-interpreter');
}

export function isLowConfidence(entry: { confidence?: number }): boolean {
  return entry.confidence !== undefined && entry.confidence < LOW_CONFIDENCE_THRESHOLD;
}

/** Width divided by height of the signer crop, for laying out the signer layer. */
export function trackAspect(t: SignTrack): number {
  return t.track.height > 0 ? t.track.width / t.track.height : 1;
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}h ${String(m % 60).padStart(2, '0')}m`
    : `${m}:${String(s).padStart(2, '0')}`;
}
