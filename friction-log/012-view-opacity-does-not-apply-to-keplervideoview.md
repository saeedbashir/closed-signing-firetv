# 012 — `opacity` on a View does not apply to the `KeplerVideoView` inside it

**Date:** 2026-09-22
**Area:** Vega SDK · w3cmedia · RN rendering
**Severity:** major

## Task attempted

Two things, one mechanism. The player's Opacity control — 100%, 85%, 70% — lets a
viewer keep the interpreter visible without fully occluding the picture. And the new
idle auto-dim fades the same layer to 35% while the interpreter is not signing. Both
set `opacity` on the `View` that positions the signer's `KeplerVideoView`, as any
React Native code would.

## Steps taken

1. Opacity control implemented on the wrapping `View`; shipped in every build since
   the player existed. Assumed working — the value changed in the overlay, the code
   was ordinary RN, and there was nothing to suggest otherwise.
2. Auto-dim implemented as an `Animated.Value` on the same `View`, native driver as
   the SDK's ESLint rule requires.
3. On device, with a test title whose activity track alternates 15 s signing and 15 s
   still: fourteen brightness samples of the signer region over seventy seconds.
4. Then, directly: measured the signer region at 100%, changed the control to 70%,
   measured again, cycled back, measured again.

## Expected

The signer to darken by about a third at 70%, and to fade during the still stretches.

## Actual

Nothing. Fourteen samples read 58.0–61.6 with no pattern. The direct test read
**59.7 at 100%, 59.9 at 70%, 59.5 at 100%** — the control has never done anything a
viewer could see, on any build.

The video surface is composited on its own plane and does not inherit its parent
view's alpha. Ordinary Views *do* draw over it: the end-of-programme panel is an
`rgba(0,0,0,0.72)` View above both surfaces and measurably dims them (main 0.33×,
signer 0.28×, friction-log/007's follow-up). So the compositor honours what is drawn
on top of the video and ignores what the video is drawn inside.

Nothing reports this. The style is accepted, the JS animates, the layout is right.

## Workaround

A **scrim**: a black `View` with `opacity = 1 − (the opacity the viewer chose)`,
animated with the native driver, drawn over the signer. Idle raises the scrim
further. Visually "70%" becomes "darkened toward black by 30%" rather than "30% of
the picture showing through" — over a television picture the difference is slight,
and darkening is arguably the better reading of the control.

Where the scrim lives turned out to matter as much as having one. The first
attempt put it *inside* the signer's container, as a child drawn after the
`KeplerVideoView`. No effect — Opacity 70% read the same as 100% with the scrim
at alpha 0.3 (`t-overlay` capture). The end panel, which does dim the video, is a
*later sibling at the root*. So: a child of the video's container is composited
beneath the video plane however late it is drawn; a later sibling of that
container draws above it. The scrim is now a sibling with the same box and
corner radius.

Result after the fix, same region, same method: **41.2 at 70% on entry, 60.4 after a
live change to 100%, 42.9 back at 70%**; and with auto-dim on, the signer stepped to
**21.2 / 20.8 / 21.6** through a still stretch of the test fixture and returned to
**43.0 / 41.0 / 42.5** when the signing resumed — 0.35× and 0.7× of the undimmed 60,
which is what the two settings ask for. Two builds before that one were verified
against the wrong code (a background edit had failed its assertion and the build
ran anyway), which is its own lesson and not the platform's fault.

## Suggestion

Either honour the parent's opacity on the video plane, or say in the
`KeplerVideoView` documentation that it does not — and say where an overlay has to
sit in the tree to draw above the video, because "a later sibling of the container,
not a child of it" is not something a React Native developer would guess.
Alongside friction-log/007's note that the view ignores its own position and size,
that is three separate layout facts that silently do nothing on one component. A
paragraph in the reference would save each of them.

## Time lost

About an hour to find, on top of a control that shipped for two days believing it
worked. The lesson is the one this log keeps recording: on this platform, measure the
pixels.
