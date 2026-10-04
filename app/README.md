# The app

React Native for Vega. Everything below was done on macOS against **Vega SDK
0.24.12044, Vega CLI 1.3.4**, the versions the friction log refers to. The SDK is in
open beta and its documentation changes; where this README and the docs disagree,
this README says what actually worked on that version.

## Prerequisites

- The Vega SDK and CLI — `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash`.
  It refuses a `$HOME` containing a space and edits your shell profile; friction-log/004
  explains why the project path must not contain a space either.
- Node 22 (the SDK bundles its own; `nvm use 22` matches).
- A Vega Virtual Device: `vega virtual-device start`.

## Build, install, run

```sh
cd app
npm ci
npm run build                      # release build; the package lands in build/aarch64-release/
vega device install-app -p build/aarch64-release/closedsigning_aarch64.vpkg
vega device launch-app -a com.closedsigning.player.main
```

`npm run build` also injects the system-distributed-library module ids from installed
packages into `manifest.toml` — that is why the file changes under you after adding a
dependency such as async-storage (friction-log/011).

A build can exit 0 while failing; check that the `.vpkg` timestamp moved.

## Tests and lint

```sh
npm test          # 185 tests: geometry, captions, the remote mapping, the idle rule, storage, …
npm run lint      # ESLint including the SDK's own rules
npx tsc --noEmit
```

Component rendering is not unit-tested; what can only be seen on a device is verified
on the device, and the screenshots and measurements are recorded in commit messages
and the friction log.

## Driving the device from a script

Nothing in the SDK reports what a Vega app is doing (friction-log/006). What works:

- **Keys:** drive the remote from the device itself:
  `vega device run-cmd -d VirtualDevice --command "inputd-cli button_press KEY_DOWN"`
  (`KEY_UP/DOWN/LEFT/RIGHT/ENTER` are the D-pad and Select). The QMP socket at
  `/tmp/qmp-socket-5554.sock` also accepts qcodes, but on 2026-09-23 they arrived as
  the wrong keys (friction-log/014). Media keys translate through neither; send the
  host keyboard's F-keys to the focused emulator window (F4 play/pause, F5 forward;
  macOS keeps F1 and F3 for itself).
- **Screen:** `screencapture -R` of the device window, then measure pixels. Contrast,
  layout, opacity and the auto-dim were all verified this way.
- **Log:** `vega device start-log-stream` does carry the app's `diag()` lines, at
  warning level and tagged `[KeplerScript-Native] [ClosedSigning]` — but a minute or
  so late, so grep after the event has flushed, not during it. Info-level lines are
  rate-limited away by the platform.
- **Diagnostics:** `src/diagnostics.ts` has a `DIAG` flag. On, the player shows an
  on-screen trace and the Open-by-address screen lists two test fixture manifests
  after the recents: `titles/_test-autodim/` (a synthetic activity track alternating
  15 s signing and 15 s still, for watching the auto-dim transitions) and
  `titles/_test-hls/` (the publisher's own HLS stream as the main video, which
  friction-log/013 records does play). Off for every shipped build.

## The catalogue

`src/catalogue.ts` is generated. To change what ships:

```sh
# after publishing a processed title to R2 (see ../HOSTING.md)
node ../tools/build-catalogue.mjs https://pub-…r2.dev/titles/<id>/manifest.json [...]
```

The two files in `assets/` are the synthetic demonstration title's media, bundled so
that one title plays with no network at all; the player prefers a bundled file when
one exists (`src/bundledMedia.ts`).

## The icon

`assets/image/ClosedSigning.png` is drawn by `../tools/icon.swift` from the design
tokens — the same diagram the first-run walkthrough uses — and referenced from
`manifest.toml` as `@image/ClosedSigning.png`. Regenerate rather than edit:

```sh
swift ../tools/icon.swift assets/image/ClosedSigning.png
```
