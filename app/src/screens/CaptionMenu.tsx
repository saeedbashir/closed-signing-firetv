/**
 * The caption menu — the other half of the access argument.
 *
 * It anchors at the top of the screen for the same reason the signer overlay
 * anchors opposite the interpreter: never cover the thing being adjusted.
 * Captions sit along the bottom, so a panel there would hide the very text the
 * viewer is choosing between.
 *
 * Playback continues underneath. Switching from verbatim to simplified is a
 * judgement about readability, and you cannot judge readability against a
 * frozen frame with no words on it.
 */
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, SectionHeading } from '../components/Text';
import { colour, layout, safeArea, space, type CaptionSize } from '../design/tokens';
import { cycle, type CaptionMode, type Preferences } from '../state/preferences';
import type { Caption } from '../stm/types';
import { isUnreviewed, trackForMode } from '../stm/useCaptions';
import { useOverlayValueKeys } from '../input/remote';
import { px } from '../design/scale';

const SIZES: readonly CaptionSize[] = ['small', 'medium', 'large'];

const SIZE_LABEL: Record<CaptionSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

const MODE_LABEL: Record<CaptionMode, string> = {
  off: 'Off',
  verbatim: 'Verbatim',
  simplified: 'Simplified',
};

/**
 * The modes this title can actually offer.
 *
 * Off is always available. The others appear only where a track exists, so the
 * viewer never cycles onto a mode that silently does nothing — which reads as
 * the captions being broken rather than absent.
 */
export function availableModes(captions: readonly Caption[]): readonly CaptionMode[] {
  const modes: CaptionMode[] = ['off'];
  if (captions.some((c) => c.kind === 'verbatim')) modes.push('verbatim');
  if (captions.some((c) => c.kind === 'simplified')) modes.push('simplified');
  return modes;
}

const Row = ({
  label,
  value,
  onChange,
  first,
  rowKey,
  onFocused,
}: {
  label: string;
  value: string;
  onChange: (delta: number) => void;
  first?: boolean;
  rowKey: string;
  onFocused?: (key: string) => void;
}): React.JSX.Element => (
  <Focusable
    style={styles.row}
    scaleOnFocus={false}
    hasTVPreferredFocus={first}
    accessibilityLabel={label}
    accessibilityRole="adjustable"
    accessibilityValue={{ text: value }}
    accessibilityHint="Left and right to change"
    onPress={() => onChange(1)}
    onFocusChange={(focused) => {
      if (focused) onFocused?.(rowKey);
    }}
  >
    {(focused) => (
      <View style={styles.rowInner}>
        <Body dim={!focused}>{label}</Body>
        <View style={styles.valueGroup}>
          <Metadata dim={!focused} style={styles.chevron}>
            {focused ? '‹' : ' '}
          </Metadata>
          <Body>{value}</Body>
          <Metadata dim={!focused} style={styles.chevron}>
            {focused ? '›' : ' '}
          </Metadata>
        </View>
      </View>
    )}
  </Focusable>
);

export const CaptionMenu = ({
  prefs,
  captions,
  onChange,
  onDismiss,
}: {
  prefs: Preferences;
  captions: readonly Caption[];
  onChange: (patch: Partial<Preferences>) => void;
  onDismiss: () => void;
}): React.JSX.Element => {
  const modes = availableModes(captions);
  const selected = trackForMode(captions, prefs.captionMode);

  /**
   * Left and Right act on whichever row has focus.
   *
   * The focused row is remembered by name, and the handlers are rewritten on
   * every render. Holding the handler itself looked simpler and was wrong: it
   * closed over the preference as it stood when the row took focus, so every
   * press recomputed from the same stale value and the setting moved once and
   * then stuck. Measured on device — Off became Verbatim and never reached
   * Simplified however many times Right was pressed.
   */
  const focusedKey = useRef<string | null>(null);
  const onFocused = useCallback((key: string) => {
    focusedKey.current = key;
  }, []);
  const handlers: Record<string, (delta: number) => void> = {
    mode: (d) => onChange({ captionMode: cycle(modes, prefs.captionMode, d) }),
    size: (d) => onChange({ captionSize: cycle(SIZES, prefs.captionSize, d) }),
  };
  const live = useRef(handlers);
  live.current = handlers;
  useOverlayValueKeys((delta) => {
    const key = focusedKey.current;
    if (key) live.current[key]?.(delta);
  }, true);

  return (
    <View style={styles.panel} accessibilityViewIsModal>
      <SectionHeading style={styles.heading}>Captions</SectionHeading>

      <Row
        first
        rowKey="mode"
        label="Captions"
        value={MODE_LABEL[prefs.captionMode]}
        onFocused={onFocused}
        onChange={(d) => handlers.mode(d)}
      />

      {/* Nothing below matters when there is no text on screen. */}
      {prefs.captionMode !== 'off' ? (
        <Row
          rowKey="size"
          label="Text size"
          value={SIZE_LABEL[prefs.captionSize]}
          onFocused={onFocused}
          onChange={(d) => handlers.size(d)}
        />
      ) : null}

      {/* The provenance is stated where the choice is made, not only where the
          text appears. Someone choosing "simplified" is deciding what to trust. */}
      {isUnreviewed(selected) ? (
        <Metadata dim style={styles.note}>
          Simplified text is written by AI and has not been checked by a person.
        </Metadata>
      ) : null}

      {modes.length === 1 ? (
        <Metadata dim style={styles.note}>
          This title has no caption tracks.
        </Metadata>
      ) : !modes.includes('simplified') ? (
        <Metadata dim style={styles.note}>
          A simplified track is not available for this title.
        </Metadata>
      ) : null}

      <Metadata dim style={styles.hint}>
        Left and right to change · Select Done to close
      </Metadata>
      <Focusable style={styles.done} onPress={onDismiss} scaleOnFocus={false}>
        <Body>Done</Body>
      </Focusable>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: safeArea.vertical,
    alignSelf: 'center',
    width: layout.overlayPanelWidth,
    padding: layout.overlayPadding,
    borderRadius: layout.overlayRadius,
    backgroundColor: colour.bgRaised,
    borderWidth: px(1),
    borderColor: colour.borderSubtle,
  },
  heading: { marginBottom: space(2) },
  row: { paddingVertical: space(1.5) },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: px(24), textAlign: 'center' },
  note: { marginTop: space(2) },
  hint: { marginTop: space(3) },
  done: { marginTop: space(2), alignItems: 'center', paddingVertical: space(1.5) },
});
