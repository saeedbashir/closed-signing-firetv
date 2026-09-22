/**
 * Diagnostics that actually reach the device log.
 *
 * `console.log` does not. In a Release build it goes nowhere, and in Debug it
 * goes to the Metro packager — so on a device driven from a script, neither
 * reaches `vega device start-log-stream`. KPLogger writes through a native
 * turbomodule and shows up in the system log where it can be read.
 *
 * The screen cannot be inspected from a script, so this is the only way to
 * check what the app believes is happening. See friction-log/006.
 */
import { KPLogger } from '@amazon-devices/react-native-kepler/Libraries/Logger/Logger';

const logger = new KPLogger('ClosedSigning');

/** Set false before shipping; noisy by design while verifying on device. */
export const DIAG = false;

export function diag(message: string): void {
  if (DIAG) logger.info(message);
}
