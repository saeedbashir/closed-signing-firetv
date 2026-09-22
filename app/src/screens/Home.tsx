/**
 * Home: a vertically scrolling page of horizontal rails.
 *
 * Rails are Continue watching (hidden when empty), All titles, and By source
 * grouped by publisher as the catalogue settles. Nothing clever — the browse
 * screen exists to reach the player, which is the product.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SignLanguageBadge as Badge } from '../components/Badge';
import { Focusable } from '../components/Focusable';
import { Body, CardTitle, Metadata, ScreenTitle, SectionHeading } from '../components/Text';
import { colour, layout, safeArea, space } from '../design/tokens';
import { formatDuration, isLowConfidence, type CatalogueEntry } from '../stm/types';
import type { Preferences } from '../state/preferences';
import { px } from '../design/scale';

const Card = ({
  entry,
  resumeMs,
  onOpen,
  first,
}: {
  entry: CatalogueEntry;
  resumeMs: number;
  onOpen: () => void;
  first?: boolean;
}): React.JSX.Element => {
  const progress = resumeMs > 0 && entry.durationMs > 0 ? resumeMs / entry.durationMs : 0;
  return (
    <Focusable
      style={styles.card}
      onPress={onOpen}
      hasTVPreferredFocus={first}
      accessibilityLabel={`${entry.title}, ${formatDuration(entry.durationMs)}`}
    >
      {(focused) => (
        <View>
          <View style={styles.poster}>
            <Badge
              languages={entry.signLanguages}
              lowConfidence={isLowConfidence(entry)}
            />
          </View>
          <CardTitle numberOfLines={2} dim={!focused} style={styles.cardTitle}>
            {entry.title}
          </CardTitle>
          <Metadata dim>{formatDuration(entry.durationMs)}</Metadata>
          {progress > 0 ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          ) : null}
        </View>
      )}
    </Focusable>
  );
};

const Rail = ({
  title,
  entries,
  prefs,
  onOpen,
  firstFocusable,
}: {
  title: string;
  entries: CatalogueEntry[];
  prefs: Preferences;
  onOpen: (id: string) => void;
  firstFocusable?: boolean;
}): React.JSX.Element | null => {
  if (entries.length === 0) return null;
  return (
    <View style={styles.rail}>
      <SectionHeading style={styles.railTitle}>{title}</SectionHeading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {entries.map((e, i) => (
          <Card
            key={e.id}
            entry={e}
            resumeMs={prefs.watchPositions[e.id] ?? 0}
            onOpen={() => onOpen(e.id)}
            first={firstFocusable && i === 0}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const Home = ({
  titles,
  prefs,
  onOpen,
  onSettings,
}: {
  titles: CatalogueEntry[];
  prefs: Preferences;
  onOpen: (id: string) => void;
  onSettings: () => void;
}): React.JSX.Element => {
  const continueWatching = useMemo(
    () => titles.filter((t) => (prefs.watchPositions[t.id] ?? 0) > 0),
    [titles, prefs.watchPositions],
  );

  if (titles.length === 0) {
    return (
      <View style={styles.empty}>
        <ScreenTitle>Nothing to watch yet</ScreenTitle>
        <Body dim style={styles.emptyBody}>
          The catalogue is empty. Check your connection and try again.
        </Body>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ScreenTitle>Closed Signing</ScreenTitle>
        <Focusable style={styles.settings} onPress={onSettings} scaleOnFocus={false}>
          <Body>Settings</Body>
        </Focusable>
      </View>
      <Rail
        title="Continue watching"
        entries={continueWatching}
        prefs={prefs}
        onOpen={onOpen}
        firstFocusable
      />
      <Rail
        title="All titles"
        entries={titles}
        prefs={prefs}
        onOpen={onOpen}
        firstFocusable={continueWatching.length === 0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colour.bgBase },
  content: { paddingVertical: safeArea.vertical, paddingLeft: safeArea.horizontal },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: safeArea.horizontal,
    marginBottom: space(4),
  },
  settings: { paddingHorizontal: space(3), paddingVertical: space(1.5) },
  rail: { marginBottom: space(5) },
  railTitle: { marginBottom: layout.railTitleGap },
  card: { width: layout.card.width, marginRight: layout.railGutter, padding: space(1.5) },
  poster: {
    width: layout.card.width - space(3),
    height: layout.card.height,
    backgroundColor: colour.bgRaised,
    borderRadius: px(8),
    justifyContent: 'flex-end',
    padding: space(1),
  },
  cardTitle: { marginTop: space(1.5) },
  progressTrack: {
    height: px(6),
    backgroundColor: colour.borderSubtle,
    borderRadius: px(3),
    marginTop: space(1),
  },
  progressFill: { height: px(6), backgroundColor: colour.accent, borderRadius: px(3) },
  empty: {
    flex: 1,
    backgroundColor: colour.bgBase,
    justifyContent: 'center',
    paddingHorizontal: safeArea.horizontal,
  },
  emptyBody: { marginTop: space(2) },
});
