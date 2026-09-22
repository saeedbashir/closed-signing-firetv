/**
 * The signer control overlay — the screen that makes the product.
 *
 * Two decisions here are the whole design, and both come from the same idea:
 * the viewer is judging a result, not filling in a form.
 *
 * It opens over live playback. The video keeps playing while they adjust, so
 * they judge the interpreter's position against moving content rather than a
 * frozen frame. And the panel anchors itself opposite the signer, so it never
 * covers the thing being adjusted.
 *
 * Every change applies instantly and writes to the profile on dismiss. No Save
 * button, no confirmation. Undoing is just moving it back.
 */
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, SectionHeading } from '../components/Text';
import {
  colour,
  layout,
  safeArea,
  signerCorners,
  signerOpacity,
  space,
  type SignerCorner,
  type SignerOpacity,
  type SignerSize,
} from '../design/tokens';
import { cycle, type Preferences } from '../state/preferences';
import { useOverlayValueKeys } from '../input/remote';
import { px } from '../design/scale';

/** The 2x2 corner grid, sized so the container always matches its contents. */
const GRID_CELL = px(56);
const GRID_GAP = px(5);

const SIZES: readonly SignerSize[] = ['small', 'medium', 'large'];
const OPACITIES: readonly SignerOpacity[] = ['full', 'high', 'medium'];

const SIZE_LABEL: Record<SignerSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};
const OPACITY_LABEL: Record<SignerOpacity, string> = {
  full: '100%',
  high: '85%',
  medium: '70%',
};
const CORNER_LABEL: Record<SignerCorner, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
};

/** A row whose value changes with Left and Right, previewing as it goes. */
const ValueRow = ({
  label,
  value,
  onChange,
  first,
  onFocused,
}: {
  label: string;
  value: string;
  onChange: (delta: number) => void;
  first?: boolean;
  onFocused?: (change: (delta: number) => void) => void;
}): React.JSX.Element => (
  <Focusable
    style={styles.row}
    scaleOnFocus={false}
    hasTVPreferredFocus={first}
    accessibilityLabel={`${label}, ${value}`}
    onPress={() => onChange(1)}
    onFocusChange={(focused) => {
      if (focused) onFocused?.(onChange);
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

/** A 2x2 grid of TV-shaped icons with the current corner filled. */
const CornerGrid = ({ corner }: { corner: SignerCorner }): React.JSX.Element => (
  <View style={styles.grid}>
    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((c) => (
      <View key={c} style={[styles.gridCell, c === corner && styles.gridCellActive]} />
    ))}
  </View>
);

export type SignerControlsProps = {
  prefs: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  onDismiss: () => void;
  /** False in the pre-composited fallback, where these controls do not exist. */
  sizeAndOpacityAvailable?: boolean;
};

export const SignerControls = ({
  prefs,
  onChange,
  onDismiss,
  sizeAndOpacityAvailable = true,
}: SignerControlsProps): React.JSX.Element => {
  const anchorLeft = prefs.signerCorner.endsWith('right');

  // Left and Right act on whichever row has focus.
  const focusedChange = useRef<((delta: number) => void) | null>(null);
  const onFocused = useCallback((change: (delta: number) => void) => {
    focusedChange.current = change;
  }, []);
  useOverlayValueKeys((delta) => focusedChange.current?.(delta), true);

  const toggleVisible = useCallback(
    () => onChange({ signerVisible: !prefs.signerVisible }),
    [onChange, prefs.signerVisible],
  );

  return (
    <View
      style={[styles.panel, anchorLeft ? styles.anchorLeft : styles.anchorRight]}
      accessibilityViewIsModal
    >
      <SectionHeading style={styles.heading}>Interpreter</SectionHeading>

      <ValueRow
        first
        onFocused={onFocused}
        label="Show interpreter"
        value={prefs.signerVisible ? 'On' : 'Off'}
        onChange={toggleVisible}
      />

      {/* Off collapses everything below it: there is nothing to position. */}
      {prefs.signerVisible ? (
        <>
          <ValueRow
            onFocused={onFocused}
            label="Position"
            value={CORNER_LABEL[prefs.signerCorner]}
            onChange={(d) =>
              onChange({ signerCorner: cycle(signerCorners, prefs.signerCorner, d) })
            }
          />
          <CornerGrid corner={prefs.signerCorner} />

          {sizeAndOpacityAvailable ? (
            <>
              <ValueRow
                onFocused={onFocused}
                label="Size"
                value={SIZE_LABEL[prefs.signerSize]}
                onChange={(d) => onChange({ signerSize: cycle(SIZES, prefs.signerSize, d) })}
              />
              <ValueRow
                onFocused={onFocused}
                label="Opacity"
                value={OPACITY_LABEL[prefs.signerOpacity]}
                onChange={(d) =>
                  onChange({ signerOpacity: cycle(OPACITIES, prefs.signerOpacity, d) })
                }
              />
            </>
          ) : (
            // Say why rather than showing controls that do nothing.
            <Metadata dim style={styles.unavailable}>
              Size and opacity are not available for this title.
            </Metadata>
          )}
        </>
      ) : null}

      <Metadata dim style={styles.hint}>
        Left and right to change · Back to close
      </Metadata>
      <Focusable style={styles.done} onPress={onDismiss} scaleOnFocus={false}>
        <Body>Done</Body>
      </Focusable>
    </View>
  );
};

export const signerOpacityValue = (o: SignerOpacity): number => signerOpacity[o];

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: safeArea.vertical,
    width: layout.overlayPanelWidth,
    padding: layout.overlayPadding,
    borderRadius: layout.overlayRadius,
    backgroundColor: colour.bgRaised,
    borderWidth: px(1),
    borderColor: colour.borderSubtle,
  },
  anchorLeft: { left: safeArea.horizontal },
  anchorRight: { right: safeArea.horizontal },
  heading: { marginBottom: space(2) },
  row: { paddingHorizontal: space(2), paddingVertical: space(1.5), marginBottom: space(1) },
  rowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: px(28), textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Derived, not a literal. Each value is rounded to whole pixels
    // independently, so a hand-written container width can disagree with the
    // sum of its contents: px(132) rounds to 66 while two cells need 68, and
    // the 2x2 grid silently became a single column. Measured on device.
    width: GRID_CELL * 2 + GRID_GAP * 4,
    alignSelf: 'center',
    marginVertical: space(1.5),
  },
  gridCell: {
    width: GRID_CELL,
    height: px(34),
    margin: GRID_GAP,
    borderRadius: px(4),
    borderWidth: px(2),
    borderColor: colour.borderSubtle,
  },
  gridCellActive: { backgroundColor: colour.accent, borderColor: colour.accent },
  unavailable: { marginTop: space(1), marginHorizontal: space(2) },
  hint: { marginTop: space(2), marginHorizontal: space(2) },
  done: {
    marginTop: space(2),
    paddingVertical: space(1.5),
    alignItems: 'center',
  },
});
