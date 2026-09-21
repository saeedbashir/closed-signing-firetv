/**
 * The transport readout, and the caption lift that goes with it.
 *
 * The clock is worth testing because the obvious reuse — `formatDuration` —
 * silently drops seconds past the hour, and the bug only appears on content
 * longer than an hour, which is exactly the parliamentary material.
 */
import {
  TRANSPORT_HEIGHT,
  formatClock,
  progressFraction,
} from '../src/components/TransportControls';
import { captionPlacement, SCREEN } from '../src/design/geometry';
import { safeArea } from '../src/design/tokens';

describe('the clock', () => {
  it.each<[number, string]>([
    [0, '0:00'],
    [1000, '0:01'],
    [61_000, '1:01'],
    [599_000, '9:59'],
    [600_000, '10:00'],
  ])('renders %sms as %s', (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });

  it('keeps seconds past the hour, which formatDuration does not', () => {
    expect(formatClock(3_661_000)).toBe('1:01:01');
    expect(formatClock(3_600_000)).toBe('1:00:00');
  });

  it('never renders a negative clock', () => {
    expect(formatClock(-5000)).toBe('0:00');
  });

  it('pads minutes only once there are hours to disambiguate them', () => {
    expect(formatClock(305_000)).toBe('5:05');
    expect(formatClock(3_905_000)).toBe('1:05:05');
  });
});

describe('the progress bar', () => {
  it('is empty at the start and full at the end', () => {
    expect(progressFraction(0, 1000)).toBe(0);
    expect(progressFraction(1000, 1000)).toBe(1);
  });

  it('clamps rather than overflowing the track', () => {
    expect(progressFraction(2000, 1000)).toBe(1);
    expect(progressFraction(-10, 1000)).toBe(0);
  });

  it('stays at zero when the duration is unknown, instead of dividing by it', () => {
    // A manifest can carry a zero duration, and NaN would reach the style as a
    // percentage string and take the layout down.
    expect(progressFraction(5000, 0)).toBe(0);
    expect(progressFraction(5000, Number.NaN)).toBe(0);
  });
});

describe('captions clearing the transport bar', () => {
  it('sits at the safe area when no chrome is showing', () => {
    expect(captionPlacement(null).bottom).toBe(safeArea.vertical);
  });

  it('lifts by exactly the bar height when it is', () => {
    expect(captionPlacement(null, undefined, undefined, TRANSPORT_HEIGHT).bottom).toBe(
      safeArea.vertical + TRANSPORT_HEIGHT,
    );
  });

  it('still clears the bar when the signer has pushed captions sideways', () => {
    const signer = { left: 1400, top: 700, width: 400, height: 300 };
    const lifted = captionPlacement(signer, SCREEN, 720, TRANSPORT_HEIGHT);
    expect(lifted.bottom).toBeGreaterThanOrEqual(safeArea.vertical + TRANSPORT_HEIGHT);
  });

  it('does not drag captions back down when they are already above the signer', () => {
    // A tall signer pushes captions above it; that is already clear of the bar,
    // and lifting again would walk them off the top of the screen.
    const tall = { left: 1200, top: 200, width: 640, height: 800 };
    const plain = captionPlacement(tall, SCREEN, 720, 0);
    const withChrome = captionPlacement(tall, SCREEN, 720, TRANSPORT_HEIGHT);
    expect(withChrome.bottom).toBeGreaterThanOrEqual(plain.bottom);
    expect(withChrome.bottom).toBeLessThan(SCREEN.height);
  });
});
