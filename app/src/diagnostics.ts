/**
 * Diagnostics that actually reach the device log.
 *
 * `console.log` does not. In a Release build it goes nowhere, and in Debug it
 * goes to the Metro packager — so on a device driven from a script, neither
 * reaches `vega device start-log-stream`. KPLogger writes through a native
 * turbomodule and shows up in the system log where it can be read.
 *
 * With one caveat found on 2026-09-22: from a Release build none of these
 * lines appeared in `start-log-stream` at all, at info or at warning, while
 * the platform's own W3CMEDIA lines kept flowing throughout. So the log route
 * cannot be relied on for a Release build, and anything that has to be
 * observed there is better rendered on screen and photographed. See
 * friction-log/006.
 */
import { KPLogger } from '@amazon-devices/react-native-kepler/Libraries/Logger/Logger';

const logger = new KPLogger('ClosedSigning');

/** Set false before shipping; noisy by design while verifying on device. */
export const DIAG = false;

/**
 * Warning level, not info. Info is rate-limited away on this device — the log
 * says so itself, `Log suppression ended at level [info]. [1030] logs were
 * suppressed` — so a diagnostic logged at info can simply never appear, which
 * reads exactly like the code not running.
 */
export function diag(message: string): void {
  if (DIAG) logger.warn(message);
}
