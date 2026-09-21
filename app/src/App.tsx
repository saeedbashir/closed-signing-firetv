/**
 * The app shell: navigation, preferences, and the catalogue.
 *
 * Three stacked routes driven by a reducer rather than a router, so focus
 * order is ours to control. Every screen declares its own initial focus
 * explicitly; the framework is never left to guess.
 */
import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErrorState } from './components/ErrorState';
import { colour } from './design/tokens';
import { currentRoute, initialNav, navReduce } from './navigation/routes';
import { Home } from './screens/Home';
import { Player } from './screens/Player';
import { TitleDetail } from './screens/TitleDetail';
import { Walkthrough } from './screens/Walkthrough';
import {
  DEFAULT_PREFERENCES,
  applyPatch,
  rememberPosition,
  resumePosition,
  type Preferences,
} from './state/preferences';
import { BUNDLED_CATALOGUE, BUNDLED_MANIFESTS } from './catalogue';

export const App = (): React.JSX.Element => {
  const [nav, dispatch] = useReducer(navReduce, initialNav);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  const route = currentRoute(nav);
  const patch = useCallback(
    (p: Partial<Preferences>) => setPrefs((cur) => applyPatch(cur, p)),
    [],
  );

  const titles = BUNDLED_CATALOGUE.titles;
  const manifest = useMemo(() => {
    const id = 'titleId' in route ? route.titleId : null;
    return id ? (BUNDLED_MANIFESTS[id] ?? null) : null;
  }, [route]);

  // Launch resolves immediately with the bundled catalogue; a networked
  // catalogue would show the loading state and time out to the offline one.
  if (route.name === 'launch') {
    dispatch({
      type: 'replace',
      route: prefs.walkthroughSeen ? { name: 'home' } : { name: 'walkthrough' },
    });
    return <View style={styles.root} />;
  }

  if (route.name === 'walkthrough') {
    return (
      <Walkthrough
        onDone={() => {
          patch({ walkthroughSeen: true });
          dispatch({ type: 'replace', route: { name: 'home' } });
        }}
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
        onPatch={patch}
        onExit={(positionMs) => {
          setPrefs((cur) => rememberPosition(cur, manifest.id, positionMs, manifest.durationMs));
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
    />
  );
};

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colour.bgBase } });
