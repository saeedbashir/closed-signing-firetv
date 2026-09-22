/**
 * Diagnostics that actually reach the device log.
 *
 * `console.log` does not. In a Release build it goes nowhere, and in Debug it
 * goes to the Metro packager — so on a device driven from a script, neither
 * reaches `vega device start-log-stream`. KPLogger writes through a native
 * turbomodule and shows up in the system log where it can be read.
 *
 * Two things learned on 2026-09-22, the second correcting the first. Info is
 * rate-limited away (the log says so itself), so `diag` writes at warning.
 * And warnings do arrive — tagged `[KeplerScript-Native] [ClosedSigning] …` —
 * but `start-log-stream` flushes them late: a grep run seconds after the event
 * found nothing, which for an afternoon read as "the log route does not work in
 * a Release build" and was written up as such. It does work; give it a minute.
 * The on-screen `DIAG` trace remains the right tool for anything that has to be
 * read at the moment it happens. See friction-log/006.
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
