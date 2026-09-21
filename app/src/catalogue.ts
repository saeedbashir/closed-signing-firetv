/**
 * The catalogue the app ships with.
 *
 * A bundled catalogue is the default build, not a fallback: the hackathon
 * rules require the repository to contain everything needed for the project
 * to be functional, and a judge should not need an AWS account to press play.
 *
 * Note for whoever wires the real assets in: Vega's media player refuses plain
 * HTTP and cannot read a local file path from inside the app sandbox, so these
 * URLs must be HTTPS. Measured, see friction-log/003.
 */
import type { Catalogue, TitleManifest } from './stm/types';

export const BUNDLED_CATALOGUE: Catalogue = {
  stmVersion: '0.1',
  titles: [],
};

export const BUNDLED_MANIFESTS: Record<string, TitleManifest> = {};
