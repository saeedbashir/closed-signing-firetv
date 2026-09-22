/**
 * Transport controls: what is playing, where we are in it, and whether it is
 * paused.
 *
 * It carries exactly one control, and the reason is a platform limit rather
 * than a design preference. This was deliberately a readout with no focus
 * targets, on the grounds that every action already had a key on the remote.
 * Then Back turned out never to reach the app at all (friction-log/008): the
 * platform takes it, and unhandled it quits to the launcher. So the only way
 * out of the player was to leave the app entirely. An on-screen Exit is not
 * decoration here, it is the only door.
 *
 * Everything else stays keys, and the bar names them instead of drawing
 * buttons for them. On a television the useful thing is to teach the remote
 * the viewer is already holding, not to add focus targets they must travel to.
 *
 * It appears on a transport press and leaves after four seconds. The viewer
 * asked what was happening, got an answer, and the picture goes back to being
 * the whole screen.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Focusable } from './Focusable';
import { Body, Metadata } from './Text';
import { colour, safeArea, space } from '../design/tokens';
import { px } from '../design/scale';

/**
 * How much vertical room the bar occupies, including its padding.
 *
 * Exported because the caption layer has to move out of the way, and the two
 * numbers must not drift apart. Raised from 156 when the bar gained the hint
 * row and the exit — a caption sitting behind the controls is exactly the
 * collision this app exists to avoid.
 */
export const TRANSPORT_HEIGHT = px(196);

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
  onExit,
  reserveRight = 0,
}: {
  title: string;
  positionMs: number;
  durationMs: number;
  paused: boolean;
  onExit: () => void;
  /**
   * Room to leave on the right for the signer layer, in logical pixels.
   *
   * The caption layer already refuses to overlap the interpreter; the bar has
   * to as well, or the Exit button ends up underneath her — which is the exact
   * collision this app exists to prevent, committed by the app itself.
   */
  reserveRight?: number;
}): React.JSX.Element => {
  const fraction = progressFraction(positionMs, durationMs);
  return (
    <View
      style={[styles.root, reserveRight > 0 ? { paddingRight: reserveRight } : null]}
      accessibilityRole="progressbar"
    >
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

      <View style={styles.footerRow}>
        {/* Naming the keys is what makes them discoverable. Nothing else on
            screen tells a viewer that Up and Down do anything at all. */}
        <Metadata style={styles.hints}>
          Up: interpreter · Down: captions · Left and Right: skip 10 seconds
        </Metadata>
        <Focusable
          style={styles.exit}
          scaleOnFocus={false}
          hasTVPreferredFocus
          accessibilityLabel="Exit to the title page"
          onPress={onExit}
        >
          {(focused) => <Body dim={!focused}>Exit</Body>}
        </Focusable>
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
    borderRadius: px(16),
    // The bar sits over moving video, so it carries its own ground rather than
    // trusting the frame behind it to be dark.
    backgroundColor: colour.captionBg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colour.textPrimary, flexShrink: 1 },
  paused: { color: colour.accent, marginLeft: space(2) },
  track: {
    height: px(8),
    borderRadius: px(4),
    backgroundColor: colour.borderSubtle,
    marginTop: space(2),
    overflow: 'hidden',
  },
  fill: { height: px(8), borderRadius: px(4), backgroundColor: colour.accent },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(1) },
  time: { color: colour.textSecondary },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space(1),
  },
  hints: { color: colour.textSecondary, flexShrink: 1 },
  exit: { paddingHorizontal: space(2), paddingVertical: space(0.5) },
});
