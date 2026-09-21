# Experiment 2 — result

**Two video surfaces decode simultaneously on the Vega Virtual Device, and the
main video does not degrade when the second starts.**

Measured 21 September on the Vega Virtual Device, SDK 0.24.12044.

## The numbers

Advance rate is playback seconds gained per second of wall clock. 1.00 is
real-time.

| Phase | main | signer |
| --- | --- | --- |
| `mainOnly` — baseline | 0.99–1.01, readyState 3 | not started |
| `addSigner` — second surface added | **0.99–1.01, unchanged** | 0.99–1.01, readyState 3 |
| `seek` — both +10s | recovers to 1.01 | recovers to 1.01, stays in sync |

Main held 0.99–1.01 before the signer started and 0.99–1.01 after. That is the
measurement the gate asked for, and it is a pass.

## What this does and does not prove

**Does:** two `VideoPlayer` instances can be initialised, sourced, and played
at real-time rate concurrently, each reaching `readyState 3`, with independent
seek. Nothing refuses a second decoder.

**Does not:**

- **This is the emulator, not hardware.** The one-secure-decoder limit Amazon
  documents is a property of the first Vega Fire TV device. An emulator need
  not reproduce hardware decoder constraints at all. Confirm on a Fire TV Stick
  4K Select before treating the two-surface player as settled.
- **Drop rate was not measured.** `getVideoPlaybackQuality()` returned
  `0/0` for both surfaces for the whole run, so the frame counters are not
  populated on the virtual device. The advance rate carried the result. Worth
  the irony: the proxy metric worked and the real API did not.
- **Rendering is unconfirmed.** The clock advanced, but the log carries
  `keplervideosink ... overlay handle is NULL`, one
  `keplermediaxformviddec ... flow not ok`, and `KeplerMediaSink ... Invalid
  configuration`. A media clock advancing is not proof that both pictures are
  on screen. **Look at the device screen before believing the pass.**
- **Sources were two 720p reference clips**, not 1080p main plus a small
  signer. In aggregate that is a harder test, not an easier one, but it is not
  the real shape.

## How to reproduce

```sh
cd ~/vega-projects/e2probe
npm run build:app
vega virtual-device start --display-res=1920,1080
vega device start-log-stream -d VirtualDevice > /tmp/e2logs.txt &
vega run-app build/aarch64-release/e2probe_aarch64.vpkg \
  com.closedsigning.e2probe.main -d VirtualDevice
grep "E2 " /tmp/e2logs.txt | sed 's/.*JavaScript\] //'
```

Terminate any previous instance first, or the old one keeps logging and the
readings interleave. That cost a false reading once already.

## The rule that cost the evening

**Vega's media player refuses plain HTTP.**

```
MediaPlayerUtils.cpp isUriSchemeSecure
Got an insecure protocol/scheme http, return error
```

It surfaces to JavaScript as `MediaError` code 4,
`MEDIA_ERR_SRC_NOT_SUPPORTED`, which reads like a codec problem and is not one.
The real line only appears in the native device log.

Four source forms were tried. Only the last works:

| Source | Result |
| --- | --- |
| `http://127.0.0.1:8099/x.mp4` + reverse port forwarding | rejected — media runs in a separate process the forward does not reach |
| `file:///tmp/x.mp4` after `vega device copy-to` | rejected — GStreamer takes the URI literally as a filename |
| `/tmp/x.mp4` bare path | rejected — the app is in a mount namespace where that is not the same `/tmp`, though `vega device run-cmd` shows the file readable |
| **`https://...`** | **works** |

Written up in `friction-log/003`.

## What this means for the project

The implementation spec's primary path is live: build the player with two
surfaces. The pre-composited fallback stays on the shelf rather than in the
build. Confirm on real hardware before feature-freezing, and keep the fallback
documented until then.

To use our own clips rather than Amazon's reference assets, they need to be on
HTTPS. The CloudFront distribution in `infra/` already serves HTTPS, so once a
title is processed and uploaded the probe can point straight at it.
