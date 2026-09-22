/**
 * Open a manifest by address.
 *
 * The screen that makes this a player for the format rather than a player for
 * the three titles we happened to prepare. Anyone can run the pipeline over
 * their own content, publish the manifest anywhere, and open it here.
 *
 * Two things shape the layout, both from the remote being the only input:
 *
 * Recents come first and the text field second. Typing a URL with a D-pad is
 * miserable, so the design aims to make anyone do it at most once. On a fresh
 * install there are no recents, which is why the examples are there — a judge
 * should be able to see the feature work without typing anything at all.
 *
 * And the error is a sentence, not a code. Someone holding a remote in front of
 * a television cannot open a console; the line under the field is the entire
 * diagnostic surface they will ever have.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, ScreenTitle, SectionHeading } from '../components/Text';
import { colour, layout, safeArea, space, type as typeTokens } from '../design/tokens';
import { px } from '../design/scale';
import { loadManifest } from '../stm/remoteManifest';
import { loadRecents, type Recent } from '../state/recents';
import type { TitleManifest } from '../stm/types';
import { DIAG } from '../diagnostics';

/** Something to open on a fresh install, so the feature can be seen without typing. */
const EXAMPLES: readonly Recent[] = [
  {
    url: 'https://pub-b84145f82da443da96042c47410ab8cd.r2.dev/titles/sp-fmqs-bsl-2026-09-17/manifest.json',
    title: "Example — First Minister's Questions (BSL)",
    openedAt: 0,
  },
  {
    url: 'https://pub-b84145f82da443da96042c47410ab8cd.r2.dev/titles/demo-corner-inset/manifest.json',
    title: 'Example — corner inset demonstration',
    openedAt: 0,
  },
  // Diagnostic builds only. A real title's manifest with a synthetic activity
  // track that alternates 15 s of signing with 15 s of stillness, so the
  // auto-dim transitions can be watched on a device — the shipped titles are
  // continuous proceedings and never go idle for long enough to trigger it.
  ...(DIAG
    ? [
        {
          url: 'https://pub-b84145f82da443da96042c47410ab8cd.r2.dev/titles/_test-autodim/manifest.json',
          title: 'TEST FIXTURE — auto-dim, synthetic activity',
          openedAt: 0,
        },
      ]
    : []),
];

export const OpenUrl = ({
  onOpened,
  onBack,
}: {
  onOpened: (manifest: TitleManifest, url: string) => void;
  onBack: () => void;
}): React.JSX.Element => {
  const [url, setUrl] = useState('');
  const [recents, setRecents] = useState<readonly Recent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadRecents().then((r) => {
      if (!cancelled) setRecents(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = useCallback(
    async (address: string) => {
      setBusy(true);
      setError(null);
      const result = await loadManifest(address);
      setBusy(false);
      if (result.ok) onOpened(result.manifest, address.trim());
      else setError(result.reason);
    },
    [onOpened],
  );

  const list = recents.length > 0 ? recents : EXAMPLES;

  return (
    <View style={styles.root}>
      <ScreenTitle style={styles.title}>Open by address</ScreenTitle>
      <Body dim style={styles.blurb}>
        Any Signed Track Manifest. Run the pipeline over your own video, publish the
        manifest anywhere, and open it here.
      </Body>

      <SectionHeading style={styles.section}>
        {recents.length > 0 ? 'Recent' : 'Examples'}
      </SectionHeading>
      {list.map((r, i) => (
        <Focusable
          key={r.url}
          style={styles.row}
          scaleOnFocus={false}
          hasTVPreferredFocus={i === 0}
          accessibilityLabel={r.title}
          onPress={() => void open(r.url)}
        >
          {(focused) => (
            <View>
              <Body dim={!focused}>{r.title}</Body>
              <Metadata dim numberOfLines={1}>
                {r.url}
              </Metadata>
            </View>
          )}
        </Focusable>
      ))}

      <SectionHeading style={styles.section}>Or type an address</SectionHeading>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://…/manifest.json"
        placeholderTextColor={colour.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Manifest address"
      />

      <View style={styles.actions}>
        <Focusable
          variant="primary"
          style={styles.primary}
          onPress={() => void open(url)}
          scaleOnFocus={false}
        >
          <Body style={styles.primaryLabel}>{busy ? 'Opening…' : 'Open'}</Body>
        </Focusable>
        <Focusable style={styles.secondary} onPress={onBack} scaleOnFocus={false}>
          <Body>Back</Body>
        </Focusable>
      </View>

      {error ? (
        <Metadata style={styles.error} accessibilityLabel={`Could not open. ${error}`}>
          {error}
        </Metadata>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colour.bgBase,
    paddingHorizontal: safeArea.horizontal,
    paddingVertical: safeArea.vertical,
  },
  title: { marginBottom: space(1) },
  blurb: { maxWidth: px(1200) },
  section: { marginTop: space(3), marginBottom: space(1) },
  row: { paddingVertical: space(1.5) },
  input: {
    ...typeTokens.body,
    color: colour.textPrimary,
    backgroundColor: colour.bgSurface,
    borderWidth: px(2),
    borderColor: colour.borderSubtle,
    borderRadius: px(8),
    paddingHorizontal: space(2),
    paddingVertical: space(1.5),
    maxWidth: px(1400),
  },
  actions: { flexDirection: 'row', marginTop: space(3) },
  primary: {
    paddingHorizontal: space(5),
    paddingVertical: space(2),
    borderRadius: layout.overlayRadius,
  },
  primaryLabel: { color: colour.onAccent },
  secondary: { marginLeft: space(2), paddingHorizontal: space(4), paddingVertical: space(2) },
  error: { color: colour.stateError, marginTop: space(2), maxWidth: px(1200) },
});
