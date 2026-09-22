/**
 * Where the signer track should be for a given point in the programme.
 *
 * `syncOffsetMs` is the one field the format hands entirely to the player:
 * interpretation lags speech, so a positive offset means the signer track
 * runs that much *behind* the main programme. The pipeline never re-encodes
 * for it; we shift. The player did not, until 2026-09-22 — the field was read
 * into the type and applied nowhere, which for a reference player is the
 * format's own rule going unkept.
 */

/** The signer track time, in seconds, for a main-programme time. Never negative. */
export function signerTimeFor(mainSeconds: number, syncOffsetMs: number): number {
  return Math.max(0, mainSeconds - syncOffsetMs / 1000);
}
