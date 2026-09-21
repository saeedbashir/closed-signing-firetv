/**
 * The player. Three independent layers composited over one another:
 * main video, signer layer, captions.
 *
 * With no overlay showing, the screen is only the content. Any D-pad press
 * summons transport controls, which fade after four seconds. The principle is
 * that chrome appears on demand and leaves on its own.
 *
 * Two surfaces is the confirmed path: Experiment 2 measured both players
 * holding real-time playback with the main video unaffected by the second
 * starting. If that ever stops being true on real hardware, the fallback is
 * pre-composited renditions, and `sizeAndOpacityAvailable` is the flag that
 * tells the control overlay to stop offering controls that would do nothing.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeplerVideoView, VideoPlayer } from '@amazon-devices/react-native-w3cmedia';
import { Body, Metadata } from '../components/Text';
import { captionPlacement, signerBox } from '../design/geometry';
import { captionSize, colour, motion, signerOpacity, space } from '../design/tokens';
import { SignerControls } from './SignerControls';
import type { Preferences } from '../state/preferences';
import { humanSignTracks, trackAspect, type TitleManifest } from '../stm/types';

type Surface = { player: VideoPlayer | null; failed: boolean };

/**
 * One media surface. Kept as a hook so the main video and the signer layer are
 * literally the same code path — if the second one behaves differently, that
 * is the platform telling us something, not our own asymmetry.
 */
function useSurface(src: string | null, autoplay: boolean) {
  const ref = useRef<Surface>({ player: null, failed: false });
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!src) return;
    const p = new VideoPlayer();
    (async () => {
      try {
        await p.initialize();
        if (cancelled) {
          await p.deinitialize();
          return;
        }
        p.src = src;
        p.pause();
        p.load();
        ref.current = { player: p, failed: false };
        if (autoplay) await p.play();
        force((n) => n + 1);
      } catch {
        // Degrade, never block: a failed signer track still leaves the
        // programme watchable, and the screen says so.
        ref.current = { player: null, failed: true };
        force((n) => n + 1);
      }
    })();
    return () => {
      cancelled = true;
      // Certification requires releasing playback resources when backgrounded.
      // With two surfaces both must come down.
      void p.deinitialize().catch(() => undefined);
      ref.current = { player: null, failed: false };
    };
  }, [src, autoplay]);

  return ref.current;
}

export const Player = ({
  manifest,
  prefs,
  onPatch,
  onExit,
  sizeAndOpacityAvailable = true,
}: {
  manifest: TitleManifest;
  prefs: Preferences;
  onPatch: (p: Partial<Preferences>) => void;
  onExit: (positionMs: number) => void;
  sizeAndOpacityAvailable?: boolean;
}): React.JSX.Element => {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [cueText] = useState('');

  const signTrack = useMemo(() => humanSignTracks(manifest)[0] ?? null, [manifest]);
  const main = useSurface(manifest.video.main.url, true);
  const signer = useSurface(
    prefs.signerVisible && signTrack ? signTrack.track.url : null,
    true,
  );

  const box = useMemo(
    () =>
      signTrack ? signerBox(prefs.signerCorner, prefs.signerSize, trackAspect(signTrack)) : null,
    [signTrack, prefs.signerCorner, prefs.signerSize],
  );
  const captions = useMemo(
    () => captionPlacement(prefs.signerVisible ? box : null),
    [box, prefs.signerVisible],
  );

  // Chrome appears on demand and leaves on its own.
  useEffect(() => {
    if (!chromeVisible || controlsOpen) return;
    const t = setTimeout(() => setChromeVisible(false), motion.chromeIdleMs);
    return () => clearTimeout(t);
  }, [chromeVisible, controlsOpen]);

  const position = useCallback(() => main.player?.currentTime ?? 0, [main.player]);

  useEffect(() => () => onExit(Math.round(position() * 1000)), [onExit, position]);

  return (
    <View style={styles.root}>
      {main.player ? (
        <KeplerVideoView
          style={StyleSheet.absoluteFill}
          videoPlayer={main.player}
          scalingmode="fit"
        />
      ) : null}

      {prefs.signerVisible && signer.player && box ? (
        <KeplerVideoView
          style={[
            styles.signer,
            { left: box.left, top: box.top, width: box.width, height: box.height },
            { opacity: signerOpacity[prefs.signerOpacity] },
          ]}
          videoPlayer={signer.player}
          scalingmode="fit"
        />
      ) : null}

      {/* Degrade, never block. */}
      {signer.failed ? (
        <View style={styles.notice}>
          <Metadata>The interpreter is unavailable for this title.</Metadata>
        </View>
      ) : null}

      {prefs.captionMode !== 'off' ? (
        <View
          style={[
            styles.captionPlate,
            { bottom: captions.bottom, left: captions.left, right: captions.right },
          ]}
        >
          {/* Cue text comes from the WebVTT track; the plate renders once cues are wired. */}
          <Body style={[styles.captionText, { fontSize: captionSize[prefs.captionSize] }]}>
            {cueText}
          </Body>
        </View>
      ) : null}

      {controlsOpen ? (
        <SignerControls
          prefs={prefs}
          onChange={onPatch}
          onDismiss={() => setControlsOpen(false)}
          sizeAndOpacityAvailable={sizeAndOpacityAvailable}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  signer: { position: 'absolute', borderRadius: 8, overflow: 'hidden' },
  notice: {
    position: 'absolute',
    bottom: space(3),
    alignSelf: 'center',
    backgroundColor: colour.captionBg,
    paddingHorizontal: space(2),
    paddingVertical: space(1),
    borderRadius: 8,
  },
  captionPlate: {
    position: 'absolute',
    backgroundColor: colour.captionBg,
    paddingHorizontal: space(2),
    paddingVertical: space(1),
    borderRadius: 8,
  },
  captionText: { color: colour.captionText, textAlign: 'center' },
});
