/**
 * The app shell: navigation, preferences, and the catalogue.
 *
 * Three stacked routes driven by a reducer rather than a router, so focus
 * order is ours to control. Every screen declares its own initial focus
 * explicitly; the framework is never left to guess.
 */
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { diag } from './diagnostics';
import { useBack, useBackRoot } from './input/useBack';
import { setReduceMotion } from './design/motion';
import { Settings } from './screens/Settings';
import { OpenUrl } from './screens/OpenUrl';
import { rememberRecent } from './state/recents';
import { load, save } from './state/storage';
import { StyleSheet, View } from 'react-native';
import { ErrorState } from './components/ErrorState';
import { colour } from './design/tokens';
import { currentRoute, initialNav, navReduce } from './navigation/routes';
import { Home } from './screens/Home';
import { Player } from './screens/Player';
import { TitleDetail } from './screens/TitleDetail';
import { Walkthrough } from './screens/Walkthrough';
import {
  PREFERENCES_KEY,
  applyPatch,
  fromStored,
  rememberPosition,
  resumePosition,
  type Preferences,
} from './state/preferences';
import { BUNDLED_CATALOGUE, BUNDLED_MANIFESTS } from './catalogue';
import type { TitleManifest } from './stm/types';

/** Skips the browse screens and opens the first title directly, so the media
 *  path can be verified from a script without a remote in hand. Off normally. */
const DEV_AUTOPLAY = false;

export const App = (): React.JSX.Element => {
  const [nav, dispatch] = useReducer(navReduce, initialNav);

  /**
   * Preferences: loaded once, written on every change.
   *
   * `null` until storage has answered, and nothing is decided before then —
   * the first route depends on `walkthroughSeen`, and deciding it against the
   * defaults would show the walkthrough to every returning viewer. That is
   * precisely what happened: `storage.ts` existed, was documented as the fix,
   * and was wired to the recents list and nothing else. Every launch reset the
   * signer to bottom-right medium, forgot every watch position, and replayed
   * the introduction. The product's own premise — set it once — was absent,
   * and nothing anywhere failed. Found by audit on 2026-09-22.
   */
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  useEffect(() => {
    let cancelled = false;
    void load<unknown>(PREFERENCES_KEY, null).then((raw) => {
      if (!cancelled) setPrefs(fromStored(raw));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    // Skip the load itself; write every change after it. A failed write is
    // dropped by `save` — the viewer loses a preference, not the programme.
    if (prefs) void save(PREFERENCES_KEY, prefs);
  }, [prefs]);
  /**
   * A manifest opened by address, which is not in the bundled catalogue.
   * Held here rather than in the route so the route stays serialisable.
   */
  const [opened, setOpened] = useState<TitleManifest | null>(null);

  const route = currentRoute(nav);
  // Temporary: the screen cannot be inspected from a script, so say where we are.
  diag(`route=${route.name} stack=${nav.stack.map((r) => r.name).join('>')}`);
  // Back pops the stack everywhere the player is not. Returning false at the
  // root is what lets the viewer actually leave the app.
  useBackRoot();
  // A device-wide setting, applied where the animation actually happens.
  setReduceMotion(prefs?.reduceMotion ?? false);
  const onBack = useCallback(() => {
    if (nav.stack.length <= 1) return false;
    dispatch({ type: 'back' });
    return true;
  }, [nav.stack.length]);
  useBack(onBack);

  const patch = useCallback(
    (p: Partial<Preferences>) => setPrefs((cur) => (cur ? applyPatch(cur, p) : cur)),
    [],
  );

  const titles = BUNDLED_CATALOGUE.titles;
  const manifest = useMemo(() => {
    const id = 'titleId' in route ? route.titleId : null;
    if (!id) return null;
    if (opened?.id === id) return opened;
    return BUNDLED_MANIFESTS[id] ?? null;
  }, [route, opened]);

  // Nothing is drawn and no route is chosen until the stored preferences are
  // in hand. The wait is one storage read — tens of milliseconds — and it is
  // the difference between remembering the viewer and greeting them as new.
  if (!prefs) return <View style={styles.root} />;

  // Launch resolves immediately with the bundled catalogue; a networked
  // catalogue would show the loading state and time out to the offline one.
  if (route.name === 'launch') {
    const first = titles[0];
    dispatch({
      type: 'replace',
      route:
        DEV_AUTOPLAY && first
          ? { name: 'player', titleId: first.id, resumeMs: 0 }
          : prefs.walkthroughSeen
          ? { name: 'home' }
          : { name: 'walkthrough' },
    });
    return <View style={styles.root} />;
  }

  if (route.name === 'walkthrough') {
    return (
      <Walkthrough
        prefs={prefs}
        onChange={patch}
        onDone={() => {
          patch({ walkthroughSeen: true });
          dispatch({ type: 'replace', route: { name: 'home' } });
        }}
      />
    );
  }

  if (route.name === 'openUrl') {
    return (
      <OpenUrl
        onOpened={(m, url) => {
          setOpened(m);
          void rememberRecent(url, m.title);
          dispatch({ type: 'push', route: { name: 'player', titleId: m.id, resumeMs: 0 } });
        }}
        onBack={() => dispatch({ type: 'back' })}
      />
    );
  }

  if (route.name === 'settings') {
    return (
      <Settings
        prefs={prefs}
        manifests={Object.values(BUNDLED_MANIFESTS)}
        onChange={patch}
        onReplayWalkthrough={() => dispatch({ type: 'replace', route: { name: 'walkthrough' } })}
        onBack={() => dispatch({ type: 'back' })}
      />
    );
  }

  if (route.name === 'detail' || route.name === 'player') {
    if (!manifest) {
      return (
        <ErrorState
          title="That title could not be loaded"
          detail="Something went wrong fetching it. The rest of the catalogue is still available."
          actionLabel="Back to all titles"
          onAction={() => dispatch({ type: 'back' })}
        />
      );
    }
    if (route.name === 'detail') {
      return (
        <TitleDetail
          manifest={manifest}
          resumeMs={resumePosition(prefs, manifest.id)}
          onPlay={(fromMs) =>
            dispatch({
              type: 'push',
              route: { name: 'player', titleId: manifest.id, resumeMs: fromMs },
            })
          }
          onStartOver={() =>
            dispatch({
              type: 'push',
              route: { name: 'player', titleId: manifest.id, resumeMs: 0 },
            })
          }
        />
      );
    }
    return (
      <Player
        manifest={manifest}
        prefs={prefs}
        resumeMs={route.resumeMs}
        onPatch={patch}
        onOpenSettings={() => dispatch({ type: 'push', route: { name: 'settings' } })}
        onProgress={(positionMs) =>
          setPrefs((cur) =>
            cur ? rememberPosition(cur, manifest.id, positionMs, manifest.durationMs) : cur,
          )
        }
        onExit={(positionMs) => {
          setPrefs((cur) =>
            cur ? rememberPosition(cur, manifest.id, positionMs, manifest.durationMs) : cur,
          );
          dispatch({ type: 'back' });
        }}
      />
    );
  }

  return (
    <Home
      titles={titles}
      prefs={prefs}
      onOpen={(id) => dispatch({ type: 'push', route: { name: 'detail', titleId: id } })}
      onSettings={() => dispatch({ type: 'push', route: { name: 'settings' } })}
      onOpenUrl={() => dispatch({ type: 'push', route: { name: 'openUrl' } })}
    />
  );
};

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colour.bgBase } });
