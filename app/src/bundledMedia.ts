/**
 * Media carried inside the application package.
 *
 * A Vega app *can* play a local file, which friction-log/003 concluded it could
 * not. That conclusion was drawn from files pushed to the device with
 * `vega device copy-to`, which land outside the app's mount namespace and are
 * genuinely unreachable. A file bundled in the `.vpkg` is inside that namespace
 * and plays — but only from a bare path. The bundler hands back a `file://`
 * URI, and GStreamer treats the scheme as part of the filename, which is what
 * made the original attempt look like a flat refusal.
 *
 * So: resolve the asset, drop the scheme, hand the path to the player.
 *
 * Why it matters beyond tidiness: the hackathon rules ask that the repository
 * contain everything needed for the project to be functional. A judge should be
 * able to press play without our storage bucket being alive, on a train, in
 * 2027. Remote titles still stream over HTTPS; this is the floor, not the
 * replacement.
 */
import { Image } from 'react-native';

/** A bundled asset's on-device path, or null if it cannot be resolved. */
function assetPath(moduleId: number): string | null {
  const resolved = Image.resolveAssetSource(moduleId);
  const uri = resolved?.uri;
  if (!uri) return null;
  // `file:///pkg/bundle/assets/...` -> `/pkg/bundle/assets/...`
  return uri.replace(/^file:\/\//, '') || null;
}

type BundledTitle = {
  main: string | null;
  /** Keyed by ISO 639-3 sign language code, matching the manifest. */
  signer: Record<string, string | null>;
};

/**
 * Titles whose media ships with the app.
 *
 * `require` needs a literal path so the bundler can see it, which is why this
 * is a hand-written map rather than generated alongside the catalogue.
 */
export const BUNDLED_MEDIA: Record<string, BundledTitle> = {
  'demo-corner-inset': {
    main: assetPath(require('../assets/demo-main.mp4')),
    signer: { ase: assetPath(require('../assets/demo-signer.mp4')) },
  },
};

/** The bundled main video for a title, or null to stream it. */
export const bundledMain = (titleId: string): string | null =>
  BUNDLED_MEDIA[titleId]?.main ?? null;

/** The bundled signer track for a title and language, or null to stream it. */
export const bundledSigner = (titleId: string, language: string): string | null =>
  BUNDLED_MEDIA[titleId]?.signer[language] ?? null;
