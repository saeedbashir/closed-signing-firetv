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
import { TRANSPORT_HEIGHT, TransportControls } from '../components/TransportControls';
import { captionPlacement, signerBox } from '../design/geometry';
import { captionSize, colour, motion, signerOpacity, space } from '../design/tokens';
import { SignerControls } from './SignerControls';
import { SEEK_SECONDS, useRemote, type RemoteAction } from '../input/remote';
import type { Preferences } from '../state/preferences';
import { humanSignTracks, trackAspect, type TitleManifest } from '../stm/types';

/** Set true to trace both surfaces in the device log, as Experiment 2 did. */
const LOG_SURFACES = false;

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

  return ref;
}

export const Player = ({
  manifest,
  prefs,
  onPatch,
  onExit,
  onOpenCaptionMenu,
  onOpenSettings,
  sizeAndOpacityAvailable = true,
}: {
  manifest: TitleManifest;
  prefs: Preferences;
  onPatch: (p: Partial<Preferences>) => void;
  onExit: (positionMs: number) => void;
  /** Not yet built. Wired so the key works the day the screen lands. */
  onOpenCaptionMenu?: () => void;
  /** Not yet built. Wired so the key works the day the screen lands. */
  onOpenSettings?: () => void;
  sizeAndOpacityAvailable?: boolean;
}): React.JSX.Element => {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [cueText] = useState('');

  const signTrack = useMemo(() => humanSignTracks(manifest)[0] ?? null, [manifest]);
  const mainRef = useSurface(manifest.video.main.url, true);
  const signerRef = useSurface(
    prefs.signerVisible && signTrack ? signTrack.track.url : null,
    true,
  );
  const main = mainRef.current;
  const signer = signerRef.current;

  const box = useMemo(
    () =>
      signTrack ? signerBox(prefs.signerCorner, prefs.signerSize, trackAspect(signTrack)) : null,
    [signTrack, prefs.signerCorner, prefs.signerSize],
  );
  const captions = useMemo(
    () =>
      captionPlacement(
        prefs.signerVisible ? box : null,
        undefined,
        undefined,
        chromeVisible ? TRANSPORT_HEIGHT : 0,
      ),
    [box, prefs.signerVisible, chromeVisible],
  );

  /**
   * A clock, but only while anyone is looking at it.
   *
   * `currentTime` is read from the player rather than counted up locally, so a
   * seek or a stall is reflected rather than drifted over. The interval only
   * runs while the bar is on screen: a re-render four times a second behind a
   * hidden bar is a cost paid for nothing, on a device with a budget.
   */
  const [positionMs, setPositionMs] = useState(0);
  useEffect(() => {
    if (!chromeVisible) return;
    const read = () => setPositionMs(Math.round((mainRef.current.player?.currentTime ?? 0) * 1000));
    read();
    const id = setInterval(read, 250);
    return () => clearInterval(id);
  }, [chromeVisible, mainRef]);

  // Chrome appears on demand and leaves on its own.
  useEffect(() => {
    if (!chromeVisible || controlsOpen) return;
    const t = setTimeout(() => setChromeVisible(false), motion.chromeIdleMs);
    return () => clearTimeout(t);
  }, [chromeVisible, controlsOpen]);

  const position = useCallback(() => mainRef.current.player?.currentTime ?? 0, [mainRef]);

  // The screen cannot be inspected from a script, so both surfaces can be
  // reported to the device log once a second. Off by default; the cost is a
  // log line per second per surface, which is noise in normal use.
  useEffect(() => {
    if (!LOG_SURFACES) return;
    const id = setInterval(() => {
      for (const [label, r] of [
        ['main', mainRef],
        ['signer', signerRef],
      ] as const) {
        const p = r.current.player;
        console.log(
          `PLAY ${label} ready=${p?.readyState ?? -1} t=${(p?.currentTime ?? 0).toFixed(2)}` +
            ` paused=${p?.paused ?? true} failed=${r.current.failed}`,
        );
      }
    }, 1000);
    return () => clearInterval(id);
    // Refs are stable; reading .current inside the interval is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving happens exactly once, whether the viewer pressed Back or the screen
  // went away underneath us.
  //
  // Two things had to be untangled here. `onExit` both saves the position and
  // navigates, and it is created inline by the caller, so a cleanup that
  // depended on it ran on every re-render of the app — meaning any preference
  // change in the signer overlay quietly exited the player. And with nothing
  // calling it, the player was a room with no door: reachable, not leavable.
  //
  // The latest callback is held in a ref so the unmount effect can depend on
  // nothing, and a flag makes the call idempotent.
  const exited = useRef(false);
  const latest = useRef({ onExit, position });
  latest.current = { onExit, position };

  const leave = useCallback(() => {
    if (exited.current) return;
    exited.current = true;
    const { onExit: exit, position: at } = latest.current;
    exit(Math.round(at() * 1000));
  }, []);

  useEffect(() => () => leave(), [leave]);

  /**
   * Transport applies to both surfaces or to neither.
   *
   * They are independent players with independent clocks, so pausing one and
   * not the other desynchronises the interpreter from the speech permanently —
   * and a signer a few seconds out is worse than no signer, because it reads as
   * fluent and means something else.
   */
  const bothSurfaces = useCallback(
    (fn: (p: VideoPlayer) => void) => {
      for (const r of [mainRef, signerRef]) {
        const p = r.current.player;
        if (p) fn(p);
      }
    },
    [mainRef, signerRef],
  );

  const seekBy = useCallback(
    (seconds: number) => {
      const anchor = mainRef.current.player;
      if (!anchor) return;
      const target = Math.max(0, anchor.currentTime + seconds);
      bothSurfaces((p) => {
        p.currentTime = target;
      });
    },
    [bothSurfaces, mainRef],
  );

  const onRemote = useCallback(
    (action: RemoteAction) => {
      switch (action) {
        case 'playPause': {
          const paused = mainRef.current.player?.paused ?? true;
          bothSurfaces((p) => {
            // play() rejects if the surface is not ready; that is a reason to
            // leave it paused, not to take the screen down.
            if (paused) p.play().catch(() => undefined);
            else p.pause();
          });
          setChromeVisible(true);
          break;
        }
        case 'seekBack':
          seekBy(-SEEK_SECONDS);
          setChromeVisible(true);
          break;
        case 'seekForward':
          seekBy(SEEK_SECONDS);
          setChromeVisible(true);
          break;
        case 'signerControls':
          setControlsOpen(true);
          break;
        case 'captionMenu':
          onOpenCaptionMenu?.();
          break;
        case 'toggleChrome':
          setChromeVisible((v) => !v);
          break;
        case 'settings':
          onOpenSettings?.();
          break;
        case 'back':
          leave();
          break;
      }
    },
    [bothSurfaces, leave, mainRef, onOpenCaptionMenu, onOpenSettings, seekBy],
  );

  // While the overlay is open it owns the remote: Up and Down move its focus.
  useRemote(onRemote, !controlsOpen);

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

      {chromeVisible && !controlsOpen ? (
        <TransportControls
          title={manifest.title}
          positionMs={positionMs}
          durationMs={manifest.durationMs}
          paused={main.player?.paused ?? true}
        />
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
