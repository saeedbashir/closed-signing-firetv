/**
 * Settings.
 *
 * Everything here also exists in the player, where it is reached in one press
 * and applied against moving content. This screen is for deciding once, before
 * pressing play — the defaults a viewer wants every time rather than the
 * adjustment they want now.
 *
 * The About section is not filler. Several of our sources require attribution
 * as a condition of the licence, and a licence honoured only in a file nobody
 * opens is not honoured. It is the last section because it is the longest, not
 * because it is the least important.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, SectionHeading } from '../components/Text';
import {
  colour,
  safeArea,
  signerCorners,
  space,
  type CaptionSize,
  type SignerCorner,
  type SignerOpacity,
  type SignerSize,
} from '../design/tokens';
import { cycle, type CaptionMode, type Preferences } from '../state/preferences';
import type { TitleManifest } from '../stm/types';
import { px } from '../design/scale';

const SIZES: readonly SignerSize[] = ['small', 'medium', 'large'];
const OPACITIES: readonly SignerOpacity[] = ['full', 'high', 'medium'];
const CAPTION_SIZES: readonly CaptionSize[] = ['small', 'medium', 'large'];
const CAPTION_MODES: readonly CaptionMode[] = ['off', 'verbatim', 'simplified'];

const LABEL = {
  size: { small: 'Small', medium: 'Medium', large: 'Large' } as Record<SignerSize, string>,
  opacity: { full: '100%', high: '85%', medium: '70%' } as Record<SignerOpacity, string>,
  corner: {
    'top-left': 'Top left',
    'top-right': 'Top right',
    'bottom-right': 'Bottom right',
    'bottom-left': 'Bottom left',
  } as Record<SignerCorner, string>,
  captionMode: { off: 'Off', verbatim: 'Verbatim', simplified: 'Simplified' } as Record<
    CaptionMode,
    string
  >,
  captionSize: { small: 'Small', medium: 'Medium', large: 'Large' } as Record<CaptionSize, string>,
};

const Row = ({
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

export const Settings = ({
  prefs,
  manifests,
  onChange,
  onReplayWalkthrough,
  onBack,
}: {
  prefs: Preferences;
  manifests: readonly TitleManifest[];
  onChange: (patch: Partial<Preferences>) => void;
  onReplayWalkthrough: () => void;
  onBack: () => void;
}): React.JSX.Element => (
  <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <SectionHeading style={styles.title}>Settings</SectionHeading>

    <SectionHeading style={styles.section}>Interpreter</SectionHeading>
    <Row
      first
      label="Show interpreter"
      value={prefs.signerVisible ? 'On' : 'Off'}
      onChange={() => onChange({ signerVisible: !prefs.signerVisible })}
    />
    {prefs.signerVisible ? (
      <>
        <Row
          label="Position"
          value={LABEL.corner[prefs.signerCorner]}
          onChange={(d) => onChange({ signerCorner: cycle(signerCorners, prefs.signerCorner, d) })}
        />
        <Row
          label="Size"
          value={LABEL.size[prefs.signerSize]}
          onChange={(d) => onChange({ signerSize: cycle(SIZES, prefs.signerSize, d) })}
        />
        <Row
          label="Opacity"
          value={LABEL.opacity[prefs.signerOpacity]}
          onChange={(d) => onChange({ signerOpacity: cycle(OPACITIES, prefs.signerOpacity, d) })}
        />
      </>
    ) : null}

    <SectionHeading style={styles.section}>Captions</SectionHeading>
    <Row
      label="Captions"
      value={LABEL.captionMode[prefs.captionMode]}
      onChange={(d) => onChange({ captionMode: cycle(CAPTION_MODES, prefs.captionMode, d) })}
    />
    {prefs.captionMode !== 'off' ? (
      <Row
        label="Text size"
        value={LABEL.captionSize[prefs.captionSize]}
        onChange={(d) => onChange({ captionSize: cycle(CAPTION_SIZES, prefs.captionSize, d) })}
      />
    ) : null}

    <SectionHeading style={styles.section}>Accessibility</SectionHeading>
    <Row
      label="Reduce motion"
      value={prefs.reduceMotion ? 'On' : 'Off'}
      onChange={() => onChange({ reduceMotion: !prefs.reduceMotion })}
    />

    <SectionHeading style={styles.section}>About</SectionHeading>
    <Focusable style={styles.row} scaleOnFocus={false} onPress={onReplayWalkthrough}>
      <Body>Replay the introduction</Body>
    </Focusable>

    <Metadata dim style={styles.aboutIntro}>
      Every title below is used under the licence shown. Where a licence requires
      attribution, that wording is reproduced exactly.
    </Metadata>

    {manifests.map((m) => (
      <View key={m.id} style={styles.attribution}>
        <Body>{m.title}</Body>
        <Metadata dim style={styles.attributionLine}>
          {m.source.publisher} · {m.source.licence}
        </Metadata>
        <Metadata dim style={styles.attributionLine}>
          {m.source.attribution}
        </Metadata>
        {m.captions.some((c) => c.generatedBy !== undefined && c.reviewed !== true) ? (
          <Metadata dim style={styles.attributionLine}>
            Simplified captions written automatically; not checked by a person.
          </Metadata>
        ) : null}
      </View>
    ))}

    {manifests.length === 0 ? (
      <Metadata dim style={styles.attributionLine}>
        No titles in the catalogue.
      </Metadata>
    ) : null}

    <Focusable style={styles.back} scaleOnFocus={false} onPress={onBack}>
      <Body>Back</Body>
    </Focusable>
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colour.bgBase },
  content: {
    paddingHorizontal: safeArea.horizontal,
    paddingTop: safeArea.vertical,
    paddingBottom: safeArea.vertical * 2,
  },
  title: { marginBottom: space(3) },
  section: { marginTop: space(4), marginBottom: space(1) },
  row: { paddingVertical: space(1.5) },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: px(24), textAlign: 'center' },
  aboutIntro: { marginTop: space(2), marginBottom: space(2) },
  attribution: {
    marginBottom: space(2),
    paddingVertical: space(1.5),
    borderTopWidth: px(1),
    borderTopColor: colour.borderSubtle,
  },
  attributionLine: { marginTop: space(0.5) },
  back: { marginTop: space(4), alignItems: 'center', paddingVertical: space(2) },
});
