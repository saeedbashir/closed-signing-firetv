# 016 — Video planes stack in the order they are created, not the order of the view tree

**Date:** 2026-10-03
**Area:** Vega SDK · media API
**Severity:** major

## Task attempted

Play two `KeplerVideoView` surfaces — the programme, and the interpreter above it —
when the viewer resumes a title part-way through.

## Steps taken

1. Open a title with **Start over**: both players start at 0.
2. Open the same title with **Resume** at about 12 minutes: both players `load()`,
   wait for `readyState >= 1`, set `currentTime`, then `play()`.
3. Check the device log and the screen.

## Expected

The interpreter's view is later in the tree than the programme's, so it draws on
top, as it does on Start over.

## Actual

On Resume the interpreter is not visible anywhere, though the log shows its
player decoding and advancing (`TIME_UPDATE` from two media elements, ~1.4 s
apart). Nothing is drawn in its box — not even the dimming view layered above it.
The interpreter's stream is much smaller than the programme's, so after the seek it
is ready first, its `KeplerVideoView` mounts first, and the programme's plane,
created afterwards, covers it. On Start over there is no seek, the two are ready
together, and the tree order happens to match creation order.

## Workaround

Do not mount the second surface until the first one's player exists
(`{signer.player && main.player ? <KeplerVideoView … /> : null}`), so the planes are
always created bottom first. Verified on Resume at ~1 and ~20 minutes.

## Suggestion

Document how video planes are ordered, or honour the view hierarchy — a z-order
that depends on which network request finished first is very hard to diagnose.
Time lost: about an hour, found while recording the demo.
