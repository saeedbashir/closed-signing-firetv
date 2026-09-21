# Experiment 2 — two video surfaces on Vega

**The question:** can a Vega app play two unencrypted MP4s simultaneously, and
at what cost?

Everything here was written from the Vega 0.24 documentation on a machine with
no Vega SDK. **None of it has been compiled.** Expect to fix an import or a
property name. It exists so your evening goes on observing rather than
scaffolding.

## What the documentation already settles

Vega's media layer is the W3C Media API over GStreamer, with hardware decoding.
Plain MP4 plays through a `VideoPlayer` and renders through `KeplerVideoView`:

```tsx
import { VideoPlayer, KeplerVideoView } from '@amazon-devices/react-native-w3cmedia';

const video = useRef<VideoPlayer | null>(new VideoPlayer());
video.current.initialize().then(() => {
  video.current.src = 'video.mp4';
  video.current.play();
});

<KeplerVideoView videoPlayer={video.current as VideoPlayer} />
```

The documented decoder limit is **one secure decoder instance**, and back-to-back
secure playback needs `await videoPlayer.deinitialize()` between players. That is
scoped to DRM content. Ours is unencrypted, so it does not bind us — but it is
the only decoder limit Amazon documents, and nothing promises two non-secure
decoders either. That is the whole reason this experiment exists.

## Setup

1. `vega project generate --template helloWorld` (or reuse the one you already have).
2. Copy `TwoSurfaceProbe.tsx` into `src/` and render it from the app entry point.
3. Merge `manifest-additions.toml` into the app's `manifest.toml`. Two of those
   services are missing from our implementation spec — see the file.
4. Drop three files in the app's assets:
   - `main.mp4` — anything 1080p, unencrypted, progressive.
   - `signer.mp4` — small: 540p or less, low bitrate. This is what the pipeline
     actually emits, so testing with a full-size second video would answer a
     question we do not have.
   - `signer-alpha.webm` — optional, for step 2b.
5. Run on the Vega Virtual Device.

To make the three files from any source video, on this machine:

```sh
ffmpeg -i source.mp4 -t 60 -c:v libx264 -crf 20 -pix_fmt yuv420p main.mp4
ffmpeg -i source.mp4 -t 60 -vf "crop=432:396:1392:612,scale=-2:396" \
       -c:v libx264 -crf 23 -pix_fmt yuv420p -an signer.mp4
ffmpeg -i signer.mp4 -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 signer-alpha.webm
```

## What to do, in order

The buttons are numbered in the order to press them.

1. **main only** — let it settle for ten seconds. Write down main's rate.
2. **add signer** — watch main's rate for ten seconds *before* looking at the
   picture. This is the measurement that matters.
3. **seek +10s** — do both surfaces follow? Do they stay in sync afterwards?
4. **pause both**, then restart. Anything stall?
5. **stop signer** — does main recover if it had degraded?
6. Background the app (Home button) and return. Does anything crash or leak?

## Reading the numbers

The HUD shows, per surface, playback position and **advance rate**: playback
seconds gained per second of wall clock. There is no documented dropped-frame
API, so this is the instrument.

| Reading | Means |
| --- | --- |
| both ≈ 1.00 | Both decode cleanly. **Pass.** |
| main ≈ 1.00, signer < 0.9 | Second surface is starved. Try a smaller, lower-bitrate signer clip before concluding. |
| main drops when signer starts | The main video is paying for the second surface. This is the outcome that forces the fallback. |
| signer fails to initialize | **Fail.** Record the exact error text. |

## What each outcome means for the project

- **Pass** — build the player with two surfaces, as the implementation spec describes.
- **Partial** — retry with the signer at 540p and a low bitrate. The real signer
  track is small; do not conclude from a full-size test clip.
- **Fail** — fall back to pre-composited renditions: five of them, four corners
  plus signer-off. Size and opacity controls stop existing, and the UI must say
  so rather than showing dead controls. Update the spec before building.

**No outcome here stops the project.** Unlike Experiment 1, every result has a
path forward. Answer it, log the friction, move on.

## Log as you go

Every snag is a friction-log entry: SDK install, the virtual device, the media
API, the manifest. Copy `friction-log/TEMPLATE.md`. The decoder question alone
should produce several, and they will be the most useful feedback the Fire TV
team gets from this hackathon.
