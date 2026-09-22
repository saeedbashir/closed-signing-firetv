/**
 * The focus primitive every interactive element uses.
 *
 * A focused element changes in four ways at once: an amber ring, a scale up,
 * a lift from surface to raised, and text from secondary to primary. That is
 * deliberate redundancy. A viewer with reduced colour perception must still
 * see the scale and brightness change when the ring reads as grey to them, so
 * focus is never signalled by colour alone.
 *
 * There are two variants because a filled button cannot use that language. A
 * screen's main action carries the amber itself, so an amber ring on it would
 * be invisible and the raised-surface lift would paint over the fill. It got
 * painted over: every primary button in the app — Play, Next, Open, Watch
 * again — lost its amber the moment it was focused and rendered near-black
 * label on near-black surface at 1.30:1. Measured on device 2026-09-22, which
 * is late for a bug that only ever appears in the focused state.
 *
 * So `primary` keeps the fill and brightens it, and takes a dark ring against
 * it: brightness, ring and scale all still change, and the label stays at
 * 13.5:1 throughout.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  type AccessibilityRole,
  type AccessibilityValue,
  type View,
  type ViewStyle,
} from 'react-native';
import { colour, focus } from '../design/tokens';
import { prefersReducedMotion } from '../design/motion';
import { px } from '../design/scale';

/** How many times to ask for the focus before giving up, at 100ms apart. */
const TRIES = 6;

/** Kepler adds `requestTVFocus` to every host view; stock React Native's types do not. */
type FocusableHost = View & { requestTVFocus?: () => void };

export type { FocusableHost };

export type FocusableProps = {
  children: React.ReactNode | ((focused: boolean) => React.ReactNode);
  onPress?: () => void;
  onFocusChange?: (focused: boolean) => void;
  /** Set on exactly one element per screen; never let the framework guess. */
  hasTVPreferredFocus?: boolean;
  /**
   * Take the focus away from whatever holds it, while this is true.
   *
   * For a panel that appears over a screen that is already focused somewhere.
   * `hasTVPreferredFocus` does not cover that case: it is honoured when a
   * screen mounts and ignored when something else already has the focus, so
   * the end-of-programme panel came up with the ring on its second button and
   * Select left the programme instead of replaying it. Measured on device
   * 2026-09-22, along with `TVFocusGuideView autoFocus`, which did nothing.
   */
  claimsFocus?: boolean;
  style?: ViewStyle;
  /** Suppress the scale, for full-width rows where growing looks wrong. */
  scaleOnFocus?: boolean;
  /** `primary` for the screen's main action, which carries the amber fill. */
  variant?: 'surface' | 'primary';
  reduceMotion?: boolean;
  accessibilityLabel?: string;
  /**
   * `button` unless told otherwise. A control that reads as plain text to a
   * screen reader is a control that does not exist for that viewer; rows the
   * viewer adjusts with Left and Right say `adjustable` and carry their value.
   */
  accessibilityRole?: AccessibilityRole;
  accessibilityValue?: AccessibilityValue;
  accessibilityHint?: string;
  /**
   * Where Down and Up go from here, as node handles, when the focus engine's
   * geometric guess is wrong. On the walkthrough's choice card, Down from a
   * wide row landed on Skip rather than the primary button beside it — the
   * row's centre was nearer Skip — so the viewer's natural "Down, Select" would
   * have skipped their own choices. Measured on device 2026-09-22.
   */
  nextFocusDown?: number;
  nextFocusUp?: number;
  /** The host node, for callers that need its handle to aim another control at it. */
  onHostRef?: (node: FocusableHost | null) => void;
};

export const Focusable = ({
  children,
  onPress,
  onFocusChange,
  hasTVPreferredFocus,
  claimsFocus,
  style,
  scaleOnFocus = true,
  variant = 'surface',
  reduceMotion,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityValue,
  accessibilityHint,
  nextFocusDown,
  nextFocusUp,
  onHostRef,
}: FocusableProps): React.JSX.Element => {
  const [focused, setFocused] = useState(false);
  const host = useRef<FocusableHost | null>(null);
  const focusedNow = useRef(false);

  const handle = useCallback(
    (next: boolean) => {
      focusedNow.current = next;
      setFocused(next);
      onFocusChange?.(next);
    },
    [onFocusChange],
  );

  /**
   * Claim the focus once, when `claimsFocus` turns true — not every time the
   * focus leaves. The first version re-ran on blur and pulled the focus back
   * within 100 ms, so the row beneath it could never be reached: Down on the
   * walkthrough's choice card did nothing, and the end panel's second button
   * was unreachable. Measured on device 2026-09-22.
   */
  const claimed = useRef(false);
  useEffect(() => {
    if (!claimsFocus) {
      claimed.current = false;
      return;
    }
    if (claimed.current) return;
    // Asked for repeatedly rather than once. The ref is a host node and
    // `requestTVFocus` is a real function on it — both checked on screen, since
    // the device log carried nothing from a Release build — but calling it on
    // the tick after mount did nothing at all, and calling it 100ms later
    // worked first time. The view is evidently not yet somewhere the focus
    // engine will send focus to when the effect runs. Retrying stops the moment
    // `focused` turns true, and gives up rather than spinning.
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (focusedNow.current || tries >= TRIES) {
        claimed.current = true;
        clearInterval(id);
        return;
      }
      host.current?.requestTVFocus?.();
    }, 100);
    return () => clearInterval(id);
  }, [claimsFocus]);

  return (
    <Pressable
      ref={(node: FocusableHost | null) => {
        host.current = node;
        onHostRef?.(node);
      }}
      nextFocusDown={nextFocusDown}
      nextFocusUp={nextFocusUp}
      onPress={onPress}
      onFocus={() => handle(true)}
      onBlur={() => handle(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={accessibilityValue}
      accessibilityHint={accessibilityHint}
      accessible
      style={[
        variant === 'primary' ? styles.primary : styles.base,
        style,
        focused && (variant === 'primary' ? styles.primaryFocused : styles.focused),
        // The ring and the brightness change stay: they are how focus is seen
        // at all, and removing them would trade one accessibility need for
        // another. It is the movement that goes.
        focused && scaleOnFocus && !(reduceMotion ?? prefersReducedMotion())
          ? { transform: [{ scale: focus.scale }] }
          : null,
      ]}
    >
      {typeof children === 'function' ? children(focused) : children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colour.bgSurface,
    borderRadius: px(12),
    borderWidth: focus.ringWidth,
    // Transparent rather than absent, so nothing shifts by 4px when focus lands.
    borderColor: 'transparent',
  },
  focused: {
    backgroundColor: colour.bgRaised,
    borderColor: colour.accent,
  },
  primary: {
    backgroundColor: colour.accent,
    borderRadius: px(12),
    borderWidth: focus.ringWidth,
    borderColor: colour.accent,
  },
  primaryFocused: {
    backgroundColor: colour.accentFocused,
    borderColor: colour.onAccent,
  },
});
