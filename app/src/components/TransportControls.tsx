/**
 * Transport controls: what is playing, where we are in it, and whether it is
 * paused.
 *
 * Deliberately not focusable. Every action it could offer already has a
 * dedicated key on the remote — Play/Pause, Left, Right — so making these
 * buttons would add a focus ring to move around a row whose entries duplicate
 * keys the viewer is already holding. It is a readout, not a control surface.
 *
 * It appears on a transport press and leaves after four seconds. The viewer
 * asked what was happening, got an answer, and the picture goes back to being
 * the whole screen.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Metadata } from './Text';
import { colour, safeArea, space } from '../design/tokens';

/**
 * How much vertical room the bar occupies, including its padding.
 *
 * Exported because the caption layer has to move out of the way, and the two
 * numbers must not drift apart.
 */
export const TRANSPORT_HEIGHT = 156;

/**
 * Position as a clock.
 *
 * `formatDuration` exists already, but it drops seconds past the hour — fine
 * for "how long is this", useless for "where am I". A viewer seeking ten
 * seconds at a time needs to see ten seconds change.
 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return h > 0
    ? `${h}:${mm}:${String(s).padStart(2, '0')}`
    : `${mm}:${String(s).padStart(2, '0')}`;
}

/** Fraction played, clamped, and safe when the duration is unknown. */
export function progressFraction(positionMs: number, durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, positionMs / durationMs));
}

export const TransportControls = ({
  title,
  positionMs,
  durationMs,
  paused,
}: {
  title: string;
  positionMs: number;
  durationMs: number;
  paused: boolean;
}): React.JSX.Element => {
  const fraction = progressFraction(positionMs, durationMs);
  return (
    <View style={styles.root} accessibilityRole="progressbar">
      <View style={styles.headerRow}>
        <Body style={styles.title} numberOfLines={1}>
          {title}
        </Body>
        {/* Paused is stated in words as well as implied by the picture holding
            still, because a still frame and a slow network look identical. */}
        {paused ? <Metadata style={styles.paused}>Paused</Metadata> : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
      </View>

      <View style={styles.timeRow}>
        <Metadata style={styles.time}>{formatClock(positionMs)}</Metadata>
        <Metadata style={styles.time}>{formatClock(durationMs)}</Metadata>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: safeArea.horizontal,
    right: safeArea.horizontal,
    bottom: safeArea.vertical,
    height: TRANSPORT_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: 16,
    // The bar sits over moving video, so it carries its own ground rather than
    // trusting the frame behind it to be dark.
    backgroundColor: colour.captionBg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colour.textPrimary, flexShrink: 1 },
  paused: { color: colour.accent, marginLeft: space(2) },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colour.borderSubtle,
    marginTop: space(2),
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: colour.accent },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(1) },
  time: { color: colour.textSecondary },
});
