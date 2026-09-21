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
import React, { useCallback } from 'react';
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
}: {
  label: string;
  value: string;
  onChange: (delta: number) => void;
  first?: boolean;
}): React.JSX.Element => (
  <Focusable
    style={styles.row}
    scaleOnFocus={false}
    hasTVPreferredFocus={first}
    accessibilityLabel={`${label}, ${value}`}
    onPress={() => onChange(1)}
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
        label="Show interpreter"
        value={prefs.signerVisible ? 'On' : 'Off'}
        onChange={toggleVisible}
      />

      {/* Off collapses everything below it: there is nothing to position. */}
      {prefs.signerVisible ? (
        <>
          <ValueRow
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
                label="Size"
                value={SIZE_LABEL[prefs.signerSize]}
                onChange={(d) => onChange({ signerSize: cycle(SIZES, prefs.signerSize, d) })}
              />
              <ValueRow
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
    borderWidth: 1,
    borderColor: colour.borderSubtle,
  },
  anchorLeft: { left: safeArea.horizontal },
  anchorRight: { right: safeArea.horizontal },
  heading: { marginBottom: space(2) },
  row: { paddingHorizontal: space(2), paddingVertical: space(1.5), marginBottom: space(1) },
  rowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: 28, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 132,
    alignSelf: 'center',
    marginVertical: space(1.5),
  },
  gridCell: {
    width: 56,
    height: 34,
    margin: 5,
    borderRadius: 4,
    borderWidth: 2,
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
