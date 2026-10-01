/**
 * Home: a vertically scrolling page of horizontal rails.
 *
 * Two rails: Continue watching (hidden when empty) and All titles. Nothing
 * clever — the browse screen exists to reach the player, which is the product.
 * A By-source rail was planned for when the catalogue had more than one
 * publisher; it does not yet.
 */
import React, {useMemo} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {SignLanguageBadge as Badge, CaptionBadge} from '../components/Badge';
import {BUNDLED_MANIFESTS} from '../catalogue';
import {Focusable} from '../components/Focusable';
import {
  Body,
  CardTitle,
  Metadata,
  ScreenTitle,
  SectionHeading,
} from '../components/Text';
import {colour, layout, safeArea, space} from '../design/tokens';
import {
  formatDuration,
  isLowConfidence,
  type CatalogueEntry,
} from '../stm/types';
import type {Preferences} from '../state/preferences';
import {lastStorageError} from '../state/storage';
import {DIAG} from '../diagnostics';
import {px} from '../design/scale';

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
  const progress =
    resumeMs > 0 && entry.durationMs > 0 ? resumeMs / entry.durationMs : 0;
  return (
    <Focusable
      style={styles.card}
      onPress={onOpen}
      hasTVPreferredFocus={first}
      accessibilityLabel={`${entry.title}, ${formatDuration(
        entry.durationMs,
      )}`}>
      {(focused) => (
        <View>
          <View style={styles.poster}>
            {/* The still sits behind the badge rather than beside it, so a
                title with no poster still shows its language rather than an
                empty rectangle. */}
            <Image
              source={{uri: entry.poster}}
              style={[StyleSheet.absoluteFill, styles.posterImage]}
              resizeMode="cover"
              accessible={false}
            />
            <View style={styles.badgeRow}>
              <Badge
                languages={entry.signLanguages}
                lowConfidence={isLowConfidence(entry)}
              />
              {/* Catalogue entries carry no caption list; the bundled manifest
                  does. A title opened by address shows no caption badge. */}
              <View style={styles.badgeGap}>
                <CaptionBadge
                  captions={BUNDLED_MANIFESTS[entry.id]?.captions}
                  compact
                />
              </View>
            </View>
          </View>
          <CardTitle numberOfLines={2} dim={!focused} style={styles.cardTitle}>
            {entry.title}
          </CardTitle>
          <Metadata dim>{formatDuration(entry.durationMs)}</Metadata>
          {progress > 0 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.round(progress * 100)}%`},
                ]}
              />
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
  onOpenUrl,
}: {
  titles: CatalogueEntry[];
  prefs: Preferences;
  onOpen: (id: string) => void;
  onSettings: () => void;
  onOpenUrl: () => void;
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
      {/* Diagnostic builds only: the one storage failure that matters, on the
          one surface where this platform lets anything be observed. */}
      {DIAG ? (
        <Metadata dim>
          {`storage: ${lastStorageError() ?? 'ok'} · seen=${String(
            prefs.walkthroughSeen,
          )} · corner=${prefs.signerCorner}`}
        </Metadata>
      ) : null}
      <View style={styles.header}>
        <ScreenTitle>Closed Signing</ScreenTitle>
        <View style={styles.headerActions}>
          {/* The catalogue is what ships; this is what makes it a player for
              the format rather than a player for our three titles. */}
          <Focusable
            style={styles.settings}
            onPress={onOpenUrl}
            scaleOnFocus={false}>
            <Body>Open by address</Body>
          </Focusable>
          <Focusable
            style={styles.settings}
            onPress={onSettings}
            scaleOnFocus={false}>
            <Body>Settings</Body>
          </Focusable>
        </View>
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
  root: {flex: 1, backgroundColor: colour.bgBase},
  content: {
    paddingVertical: safeArea.vertical,
    paddingLeft: safeArea.horizontal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: safeArea.horizontal,
    marginBottom: space(4),
  },
  headerActions: {flexDirection: 'row', alignItems: 'center'},
  settings: {paddingHorizontal: space(3), paddingVertical: space(1.5)},
  rail: {marginBottom: space(5)},
  railTitle: {marginBottom: layout.railTitleGap},
  card: {
    width: layout.card.width,
    marginRight: layout.railGutter,
    padding: space(1.5),
  },
  poster: {
    width: layout.card.width - space(3),
    height: layout.card.height,
    backgroundColor: colour.bgRaised,
    borderRadius: px(8),
    justifyContent: 'flex-end',
    padding: space(1),
    overflow: 'hidden',
  },
  posterImage: {borderRadius: px(8)},
  badgeRow: {flexDirection: 'row', alignItems: 'flex-end'},
  badgeGap: {marginLeft: space(1)},
  cardTitle: {marginTop: space(1.5)},
  progressTrack: {
    height: px(6),
    backgroundColor: colour.borderSubtle,
    borderRadius: px(3),
    marginTop: space(1),
  },
  progressFill: {
    height: px(6),
    backgroundColor: colour.accent,
    borderRadius: px(3),
  },
  empty: {
    flex: 1,
    backgroundColor: colour.bgBase,
    justifyContent: 'center',
    paddingHorizontal: safeArea.horizontal,
  },
  emptyBody: {marginTop: space(2)},
});
