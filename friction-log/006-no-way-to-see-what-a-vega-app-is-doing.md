# 006 — No working way to observe a Vega app from a script

**Date:** 2026-09-21
**Area:** Vega SDK · VVD
**Severity:** major

## Task attempted

Verify, without a human watching the emulator, that a newly built screen renders and
that remote key presses produce the intended effect.

## Steps taken

Four independent routes, in order.

1. **`console.log`, read via `vega device start-log-stream`.** Added a log line to the
   app's top-level render, so it could not be missed.
2. **`console.log` from a Debug build** (`npm run build:debug`), in case Release strips it.
3. **`KPLogger` from `@amazon-devices/react-native-kepler/Libraries/Logger/Logger`**,
   which logs through a native turbomodule and ought to reach the system log.
4. **QMP `screendump`** against the VVD's QEMU monitor socket, to read the framebuffer.

## Expected

At least one of these to show either what the app printed or what it drew.

## Actual

1. Nothing. The app is plainly alive in the log — `MountingManager::SurfaceTelemetryLogger
   surfaceId=1 mutations=111 transactions=7`, Volta gesture creation, shader cache
   writes — but no JS output.
2. Nothing. In Debug, JS logging goes to the Metro packager, not the device, so a
   script-driven device run sees nothing either way.
3. Nothing. No error, no output. `new KPLogger('ClosedSigning')` did not throw and the
   app kept running, so the call is being made and discarded somewhere below JS.
4. A 1920x1080 frame that is **uniformly black** — one distinct byte value across a
   megabyte. The compositor evidently presents through a plane QEMU's `screendump`
   does not see.

What *did* work was input injection. QMP `input-send-event` with qcodes reaches the
app, confirmed from the app's own native logging:

```
com.closedsigning.player[360332]: 2 I GWSI_LOG:94 Injected key:[INPUT] state:0 evtId:13
```

So a script can drive a Vega app but cannot observe one. That is the wrong way round.

## CORRECTION, same day

**This entry overstated the problem, and the correction matters more than the
complaint.** Capturing the *host window* works and closes the loop completely:

```bash
screencapture -x full.png     # then crop to the VVD window's bounds
```

It initially failed with `could not create image from display`, which is macOS
withholding Screen Recording permission from the terminal — not a platform limit. Once
granted, the emulator's screen is readable at full 1920x1080, and combined with QMP key
injection a script can drive *and* observe the whole app. Locating the window with
`osascript -e 'tell application "System Events" ... get {position, size} of window 1'`
makes the capture robust when the window moves.

That loop then found, in one session: every layout rendering at double size, a video
surface ignoring its own position, an overlay that could not be dismissed, and a 2x2
grid collapsed into a column. None of those were reachable any other way.

So the platform gap is narrower than first written, and specific: **QEMU's `screendump`
cannot see the plane Vega composites to, and the Vega CLI has no screenshot command.**
Both remain true. What was wrong was concluding that nothing could observe the app.

## Workaround

Capture the host window, as above. Within the device itself, none. Verification falls back to a human watching the emulator
window and reporting what they see, which does not scale, cannot run in CI, and cannot
be done by whoever is not at the machine.

Partial mitigations used here: assert as much as possible in Jest against the pure
functions (the WebVTT parser was validated against 10 real caption files and 2,949
cues without a device), and confirm the package installs, launches and stays running.
Neither tells you whether anything was drawn.

## Suggestion

Any one of these would close it, in order of preference:

1. Route JS `console` output to the system log in Release builds, or document the
   supported way to get it there. This is the obvious expectation and it is silently
   unmet.
2. Make `KPLogger` reach `start-log-stream`. It appears to be the intended mechanism
   for exactly this and produces nothing.
3. Provide a screenshot command — `vega device screenshot` — that captures what the
   compositor presents rather than the QEMU framebuffer.

The cost is not the debugging time, it is that a TV app's correctness is almost
entirely visual, and the platform currently offers no automated way to check it.

## Time lost

Roughly 90 minutes across the four routes, and the underlying problem is unsolved: the
verification that prompted this is still pending a human looking at a screen.
