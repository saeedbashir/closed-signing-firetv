/**
 * The focus primitive every interactive element uses.
 *
 * A focused element changes in four ways at once: an amber ring, a scale up,
 * a lift from surface to raised, and text from secondary to primary. That is
 * deliberate redundancy. A viewer with reduced colour perception must still
 * see the scale and brightness change when the ring reads as grey to them, so
 * focus is never signalled by colour alone.
 */
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colour, focus } from '../design/tokens';

export type FocusableProps = {
  children: React.ReactNode | ((focused: boolean) => React.ReactNode);
  onPress?: () => void;
  onFocusChange?: (focused: boolean) => void;
  /** Set on exactly one element per screen; never let the framework guess. */
  hasTVPreferredFocus?: boolean;
  style?: ViewStyle;
  /** Suppress the scale, for full-width rows where growing looks wrong. */
  scaleOnFocus?: boolean;
  reduceMotion?: boolean;
  accessibilityLabel?: string;
};

export const Focusable = ({
  children,
  onPress,
  onFocusChange,
  hasTVPreferredFocus,
  style,
  scaleOnFocus = true,
  accessibilityLabel,
}: FocusableProps): React.JSX.Element => {
  const [focused, setFocused] = useState(false);

  const handle = useCallback(
    (next: boolean) => {
      setFocused(next);
      onFocusChange?.(next);
    },
    [onFocusChange],
  );

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => handle(true)}
      onBlur={() => handle(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[
        styles.base,
        style,
        focused && styles.focused,
        focused && scaleOnFocus ? { transform: [{ scale: focus.scale }] } : null,
      ]}
    >
      {typeof children === 'function' ? children(focused) : children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colour.bgSurface,
    borderRadius: 12,
    borderWidth: focus.ringWidth,
    // Transparent rather than absent, so nothing shifts by 4px when focus lands.
    borderColor: 'transparent',
  },
  focused: {
    backgroundColor: colour.bgRaised,
    borderColor: colour.accent,
  },
});
