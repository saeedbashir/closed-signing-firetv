/**
 * Title detail. Attribution is displayed here, not buried in a footer.
 *
 * Several sources require it, and beyond the requirement it is the honest
 * thing: an interpreter's performance is being republished in a new
 * presentation, which is precisely what this project is about.
 */
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SignLanguageBadge } from '../components/Badge';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, ScreenTitle } from '../components/Text';
import { colour, safeArea, space } from '../design/tokens';
import {
  LOW_CONFIDENCE_THRESHOLD,
  formatDuration,
  humanSignTracks,
  type TitleManifest,
} from '../stm/types';
import { px } from '../design/scale';

export const TitleDetail = ({
  manifest,
  resumeMs,
  onPlay,
  onStartOver,
}: {
  manifest: TitleManifest;
  resumeMs: number;
  onPlay: (fromMs: number) => void;
  onStartOver: () => void;
}): React.JSX.Element => {
  const tracks = humanSignTracks(manifest);
  const confidence = tracks[0]?.extraction?.confidence;
  const low = confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD;
  const progress = resumeMs > 0 && manifest.durationMs > 0 ? resumeMs / manifest.durationMs : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.still}>
        <Image
          source={{ uri: manifest.video.poster }}
          style={[StyleSheet.absoluteFill, styles.stillImage]}
          resizeMode="cover"
          accessible={false}
        />
      </View>
      <ScreenTitle style={styles.title}>{manifest.title}</ScreenTitle>
      <View style={styles.metaRow}>
        <Metadata dim>{formatDuration(manifest.durationMs)}</Metadata>
        <Metadata dim style={styles.dot}>
          ·
        </Metadata>
        <Metadata dim>{manifest.source.publisher}</Metadata>
      </View>

      <View style={styles.badges}>
        <SignLanguageBadge
          languages={tracks.map((t) => t.language)}
          lowConfidence={low}
        />
      </View>
      {tracks.length > 0 ? (
        <Body dim style={styles.para}>
          {tracks.map((t) => t.languageLabel).join(' and ')} by a human interpreter.
          {low
            ? ' The interpreter was located automatically and the crop may be imperfect on this title.'
            : ''}
        </Body>
      ) : (
        <Body dim style={styles.para}>
          No separate interpreter track for this title.
        </Body>
      )}

      <View style={styles.actions}>
        <Focusable
          hasTVPreferredFocus
          variant="primary"
          style={styles.primary}
          onPress={() => onPlay(resumeMs)}
        >
          {() => <Body style={styles.primaryLabel}>{progress > 0 ? 'Resume' : 'Play'}</Body>}
        </Focusable>
        {progress > 0 ? (
          <Focusable style={styles.secondary} onPress={onStartOver}>
            <Body>Start over</Body>
          </Focusable>
        ) : null}
      </View>
      {progress > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}

      <Metadata dim style={styles.attribution}>
        {manifest.source.attribution}
        {manifest.source.productionCredit ? `  ${manifest.source.productionCredit}` : ''}
      </Metadata>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colour.bgBase },
  content: { paddingHorizontal: safeArea.horizontal, paddingVertical: safeArea.vertical },
  still: {
    height: px(320),
    borderRadius: px(12),
    backgroundColor: colour.bgSurface,
    overflow: 'hidden',
  },
  stillImage: { borderRadius: px(12) },
  title: { marginTop: space(3) },
  metaRow: { flexDirection: 'row', marginTop: space(1) },
  dot: { marginHorizontal: space(1) },
  badges: { marginTop: space(2) },
  para: { marginTop: space(2), maxWidth: px(1200) },
  actions: { flexDirection: 'row', marginTop: space(4) },
  primary: { paddingHorizontal: space(5), paddingVertical: space(2) },
  primaryLabel: { color: colour.onAccent },
  secondary: {
    marginLeft: space(2),
    paddingHorizontal: space(4),
    paddingVertical: space(2),
  },
  progressTrack: {
    height: px(6),
    width: px(520),
    backgroundColor: colour.borderSubtle,
    borderRadius: px(3),
    marginTop: space(2),
  },
  progressFill: { height: px(6), backgroundColor: colour.accent, borderRadius: px(3) },
  attribution: { marginTop: space(5), maxWidth: px(1200) },
});
