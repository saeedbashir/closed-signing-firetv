/**
 * Experiment 2 — can a Vega app decode two video surfaces at once?
 *
 * Written against the real type definitions shipped in
 * `@amazon-devices/react-native-w3cmedia@2.3.2`, not from prose docs.
 *
 * What it measures
 * ----------------
 * `VideoPlayer.getVideoPlaybackQuality()` returns `droppedVideoFrames` and
 * `totalVideoFrames`, so the question the gate asks — "do both decode, and does
 * the main video hold frame rate" — is answered directly by the **drop rate**
 * of each surface.
 *
 * A second, independent signal is kept alongside it: **advance rate**, playback
 * seconds gained per second of wall clock, sampled from `currentTime`. The two
 * fail differently and you want both. A starved decoder drops frames while the
 * clock keeps moving; a stalled pipeline freezes the clock while dropping
 * nothing, because no frame is ever attempted.
 *
 * Read the numbers, not the picture. A second surface can look fine in a screen
 * recording while the first has quietly started dropping a third of its frames.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoPlayer, KeplerVideoView } from '@amazon-devices/react-native-w3cmedia';

/** Two unencrypted progressive MP4s over **HTTPS**.
 *
 *  THE RULE THAT COSTS AN EVENING: Vega's media player refuses plain HTTP.
 *
 *      MediaPlayerUtils.cpp isUriSchemeSecure
 *      Got an insecure protocol/scheme http, return error
 *
 *  It surfaces to JavaScript as MediaError code 4
 *  (MEDIA_ERR_SRC_NOT_SUPPORTED), which reads like a codec problem and is not
 *  one. The real line is only in the native device log.
 *
 *  Three other source forms were tried and all fail the same way, see
 *  friction-log/003:
 *    * `http://10.0.2.2:8099/x.mp4` (QEMU host alias) — reachable by curl from
 *      the device, rejected by the player purely for being http.
 *    * `http://127.0.0.1:8099` with reverse port forwarding — media runs in a
 *      separate process the forward does not reach.
 *    * `file:///tmp/x.mp4` or bare `/tmp/x.mp4` after `vega device copy-to` —
 *      the app is in a mount namespace where that is not the same `/tmp`.
 *
 *  To serve your own clips, they must be on HTTPS. Amazon's reference assets
 *  below are the quickest way to get a first answer; swap in a correctly sized
 *  signer clip (540p or less, low bitrate — what the pipeline actually emits)
 *  once you have somewhere HTTPS to put it.
 */
const REF = 'https://d1v0fxmwkpxbrg.cloudfront.net/videos/mp4';
const MAIN_SRC = `${REF}/tears-of-steel/720p/tears-of-steel.mp4`;
const SIGNER_SRC = `${REF}/glass-half/720p/glass-half.mp4`;
/** Ten minutes of the evening: does the stack decode VP9 with alpha? If it
 *  does, the signer becomes a transparent overlay and the fill problem softens. */
const SIGNER_ALPHA_SRC = `${REF}/cosmos-laundromat/720p/cosmos-laundromat.mp4`;

const SAMPLE_MS = 1000;

/** Run the sequence automatically on mount. A scripted, timed run produces
 *  numbers that can be compared between attempts; pressing buttons by hand
 *  does not. Set false to drive it with the remote instead. */
const AUTO_RUN = true;

/** Phase boundaries in ms from mount. Each phase is long enough for the
 *  decoder to settle before the next change. */
const PHASES = {
  mainOnly: 3000,
  addSigner: 15000,
  seek: 27000,
  pauseResume: 35000,
  stopSigner: 45000,
  finish: 55000,
} as const;

/** Readings collected per phase, so the summary is per phase rather than an
 *  average over a run whose conditions changed halfway through. */
const collected: Record<string, Record<string, number[]>> = {};

function record(phase: string, surface: string, dropRate: number, advance: number): void {
  const key = `${phase}/${surface}`;
  collected[key] = collected[key] ?? { drop: [], adv: [] };
  collected[key].drop.push(dropRate);
  collected[key].adv.push(advance);
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function summarise(): void {
  console.log('E2 ==================== SUMMARY ====================');
  console.log('E2 phase/surface           samples  mean advance  mean drop%');
  for (const key of Object.keys(collected)) {
    const c = collected[key];
    console.log(
      `E2 ${key.padEnd(24)} ${String(c.drop.length).padStart(7)} ` +
        `${mean(c.adv).toFixed(2).padStart(13)} ${(mean(c.drop) * 100).toFixed(1).padStart(11)}`,
    );
  }
  console.log('E2 =================================================');
  console.log('E2 PASS if both surfaces hold advance ~1.00 and drop% stays low');
  console.log('E2 once the signer starts. The failure that matters is MAIN');
  console.log('E2 degrading between phase mainOnly and phase addSigner.');
}

type Reading = {
  time: number;
  advanceRate: number;
  dropped: number;
  total: number;
  dropRate: number;
  readyState: number;
};

const EMPTY: Reading = {
  time: 0,
  advanceRate: 0,
  dropped: 0,
  total: 0,
  dropRate: 0,
  readyState: 0,
};

function useSurface(label: string, phase: React.MutableRefObject<string>) {
  const player = useRef<VideoPlayer | null>(null);
  const lastTime = useRef(0);
  const lastWall = useRef(0);
  const [reading, setReading] = useState<Reading>(EMPTY);
  const [status, setStatus] = useState('idle');

  const start = useCallback(async (src: string) => {
    try {
      setStatus('initializing');
      const p = new VideoPlayer();
      await p.initialize();
      p.src = src;
      // The official Vega video sample pauses and calls load() after setting
      // src for progressive MP4. Setting src alone does not start the fetch.
      p.pause();
      p.load();
      player.current = p;
      lastTime.current = 0;
      lastWall.current = Date.now();
      await p.play();
      setStatus('playing');
    } catch (err) {
      setStatus(`FAILED: ${String(err)}`);
    }
  }, []);

  const stop = useCallback(async () => {
    const p = player.current;
    player.current = null;
    if (!p) return;
    try {
      // Certification requires releasing playback resources when backgrounded.
      // With two surfaces both must be torn down, and the order is part of
      // what this experiment is measuring.
      await p.deinitialize();
      setStatus('deinitialized');
    } catch (err) {
      setStatus(`deinit FAILED: ${String(err)}`);
    }
    setReading(EMPTY);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const p = player.current;
      if (!p) return;
      const now = Date.now();
      const t = p.currentTime;
      const dt = (now - lastWall.current) / 1000;
      const advanceRate = dt > 0 ? (t - lastTime.current) / dt : 0;
      lastTime.current = t;
      lastWall.current = now;

      let dropped = 0;
      let total = 0;
      try {
        const q = p.getVideoPlaybackQuality();
        dropped = q.droppedVideoFrames;
        total = q.totalVideoFrames;
      } catch {
        // Quality metrics are best-effort; the advance rate still stands.
      }
      const next = {
        time: t,
        advanceRate,
        dropped,
        total,
        dropRate: total > 0 ? dropped / total : 0,
        readyState: p.readyState,
      };
      setReading(next);
      record(phase.current, label, next.dropRate, next.advanceRate);
      // Also to the log, so the experiment can be read from `vega device
      // start-log-stream` without watching the screen. The screen is the
      // demo; the log is the measurement.
      console.log(
        `E2 ${label} t=${next.time.toFixed(2)} adv=${next.advanceRate.toFixed(2)} ` +
          `drop=${next.dropped}/${next.total} (${(next.dropRate * 100).toFixed(1)}%) ` +
          `ready=${next.readyState}` +
          ` phase=${phase.current}`,
      );
    }, SAMPLE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => void stop(), [stop]);

  return { label, reading, status, start, stop, player };
}

/** `PressableStateCallbackType` carries `pressed`, not `focused`, so TV focus
 *  is tracked with onFocus/onBlur rather than the style callback. */
const Button = ({ title, onPress }: { title: string; onPress: () => void }) => {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.button, focused ? styles.buttonFocused : null]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
};

export const TwoSurfaceProbe = (): React.JSX.Element => {
  const phase = useRef<string>('idle');
  const main = useSurface('main', phase);
  const signer = useSurface('signer', phase);
  const [note, setNote] = useState(
    AUTO_RUN ? 'auto run: starting…' : 'Start main alone. Let it settle. Then add the signer.',
  );

  const seekBoth = useCallback(
    (delta: number) => {
      for (const p of [main.player.current, signer.player.current]) {
        if (!p) continue;
        try {
          p.currentTime = p.currentTime + delta;
        } catch (err) {
          setNote(`seek failed: ${String(err)}`);
        }
      }
    },
    [main.player, signer.player],
  );

  const pauseBoth = useCallback(() => {
    for (const p of [main.player.current, signer.player.current]) {
      try {
        p?.pause();
      } catch (err) {
        setNote(`pause failed: ${String(err)}`);
      }
    }
  }, [main.player, signer.player]);

  useEffect(() => {
    if (!AUTO_RUN) return;
    const enter = (name: string, note_: string, fn?: () => void) => {
      phase.current = name;
      setNote(`${name}: ${note_}`);
      console.log(`E2 ---- phase ${name} : ${note_}`);
      fn?.();
    };
    const timers = [
      setTimeout(
        () => enter('mainOnly', 'main alone, establishing the baseline', () => {
          void main.start(MAIN_SRC);
        }),
        PHASES.mainOnly,
      ),
      setTimeout(
        () => enter('addSigner', 'second surface added — watch MAIN', () => {
          void signer.start(SIGNER_SRC);
        }),
        PHASES.addSigner,
      ),
      setTimeout(() => enter('seek', 'seeking both +10s', () => seekBoth(10)), PHASES.seek),
      setTimeout(
        () => enter('pauseResume', 'pause then resume both', () => {
          pauseBoth();
          setTimeout(() => {
            void main.player.current?.play();
            void signer.player.current?.play();
          }, 2000);
        }),
        PHASES.pauseResume,
      ),
      setTimeout(
        () => enter('stopSigner', 'signer torn down — does main recover?', () => {
          void signer.stop();
        }),
        PHASES.stopSigner,
      ),
      setTimeout(() => {
        enter('done', 'run complete');
        summarise();
      }, PHASES.finish),
    ];
    return () => timers.forEach(clearTimeout);
    // Runs once on mount; the surface hooks are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      {main.player.current ? (
        <KeplerVideoView
          style={StyleSheet.absoluteFill}
          videoPlayer={main.player.current}
          scalingmode="fit"
        />
      ) : null}
      {signer.player.current ? (
        <KeplerVideoView
          style={styles.signerSurface}
          videoPlayer={signer.player.current}
          scalingmode="fit"
        />
      ) : null}

      <View style={styles.hud}>
        <Text style={styles.hudHead}>
          {'surface  advance   dropped/total   drop%  ready  status'}
        </Text>
        {[main, signer].map((s) => (
          <Text key={s.label} style={styles.hudLine}>
            {s.label.padEnd(8)}
            {s.reading.advanceRate.toFixed(2).padStart(7)}
            {`${s.reading.dropped}/${s.reading.total}`.padStart(16)}
            {(s.reading.dropRate * 100).toFixed(1).padStart(7)}
            {String(s.reading.readyState).padStart(7)}
            {'  '}
            {s.status}
          </Text>
        ))}
        <Text style={styles.note}>{note}</Text>
      </View>

      <View style={styles.controls}>
        <Button title="1. main only" onPress={() => void main.start(MAIN_SRC)} />
        <Button title="2. add signer" onPress={() => void signer.start(SIGNER_SRC)} />
        <Button title="2b. signer webm alpha" onPress={() => void signer.start(SIGNER_ALPHA_SRC)} />
        <Button title="3. seek +10s" onPress={() => seekBoth(10)} />
        <Button title="4. pause both" onPress={pauseBoth} />
        <Button title="5. stop signer" onPress={() => void signer.stop()} />
        <Button title="6. stop main" onPress={() => void main.stop()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0F14' },
  signerSurface: { position: 'absolute', right: 48, bottom: 48, width: 384, height: 352 },
  hud: {
    position: 'absolute',
    left: 48,
    top: 48,
    backgroundColor: '#000000C0',
    padding: 16,
    borderRadius: 12,
  },
  hudHead: { color: '#A3B1BF', fontSize: 22, fontFamily: 'monospace' },
  hudLine: { color: '#F2F5F7', fontSize: 26, fontFamily: 'monospace' },
  note: { color: '#FFB020', fontSize: 22, marginTop: 8 },
  controls: {
    position: 'absolute',
    left: 48,
    bottom: 48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    backgroundColor: '#1F2933',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonFocused: { backgroundColor: '#FFB020', transform: [{ scale: 1.06 }] },
  buttonText: { color: '#F2F5F7', fontSize: 24 },
});

export default TwoSurfaceProbe;
