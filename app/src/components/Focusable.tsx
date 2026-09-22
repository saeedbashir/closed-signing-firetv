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
import { Pressable, StyleSheet, type View, type ViewStyle } from 'react-native';
import { colour, focus } from '../design/tokens';
import { prefersReducedMotion } from '../design/motion';
import { px } from '../design/scale';

/** How many times to ask for the focus before giving up, at 100ms apart. */
const TRIES = 6;

/** Kepler adds `requestTVFocus` to every host view; stock React Native's types do not. */
type FocusableHost = View & { requestTVFocus?: () => void };

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
}: FocusableProps): React.JSX.Element => {
  const [focused, setFocused] = useState(false);
  const host = useRef<FocusableHost | null>(null);

  const handle = useCallback(
    (next: boolean) => {
      setFocused(next);
      onFocusChange?.(next);
    },
    [onFocusChange],
  );

  useEffect(() => {
    if (!claimsFocus || focused) return;
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
      host.current?.requestTVFocus?.();
      if (tries >= TRIES) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [claimsFocus, focused]);

  return (
    <Pressable
      ref={host}
      onPress={onPress}
      onFocus={() => handle(true)}
      onBlur={() => handle(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityLabel={accessibilityLabel}
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
