# 010 — Nothing documented moves focus to a panel that appears over a focused screen

**Date:** 2026-09-22
**Area:** Vega SDK · RN focus
**Severity:** major

## Task attempted

Show an end-of-programme panel when a title finishes — "Watch again" and "Back to
the title" — with the focus on the first button, so that Select does the obvious
thing.

## Steps taken

1. **`hasTVPreferredFocus`** on the first button. This works: it is what puts the
   focus on Play when the title screen mounts, and on Next in the walkthrough.
2. **Remounting** that button with a changed `key` a tick after the panel appears,
   so the flag would be applied to a freshly created native view.
3. **`TVFocusGuideView`** wrapping the two buttons, with `autoFocus` — whose
   documentation says it "will redirect the focus to the first focusable child on
   the first visit" — and `trapFocusLeft` / `trapFocusRight`.
4. **`requestTVFocus()`** on the button's host ref, on the tick after mount.

## Expected

Any of four documented routes to put the focus on a button that has just appeared.

## Actual

The first three do nothing at all. The panel comes up with the ring on the *second*
button every time, so Select — the one key a viewer presses without thinking —
leaves the programme instead of replaying it.

The fourth does work, but not when called. `requestTVFocus` is a real function on
the host ref, which an on-screen probe confirmed:

```
node=y rtvf=function focus=function keys=__nativeTag __internalInstanceHandle __viewConfig requestTVFocus
```

Calling it on `setTimeout(…, 0)` after the effect: nothing. Calling it 100ms later:
the focus moves on the first attempt. So the view exists, is referenced, and
answers the call, and for something under a tenth of a second it is not yet
somewhere the focus engine will send focus to. Nothing reports that state.

## Workaround

Ask repeatedly and stop when it lands:

```ts
let tries = 0;
const id = setInterval(() => {
  tries += 1;
  host.current?.requestTVFocus?.();
  if (tries >= 6) clearInterval(id);
}, 100);
```

The effect re-runs when the element's own `onFocus` fires, which cancels the
interval. Six attempts, then give up rather than spin.

## Suggestion

Say in the documentation that `hasTVPreferredFocus` applies when a screen mounts
and is ignored when something else already holds the focus — that one sentence
would have been enough, and the prop's name implies the opposite. Then either make
`TVFocusGuideView autoFocus` work for a panel that appears, or document
`requestTVFocus` as the way to do it, with a word about when the view becomes
focusable.

The retry loop is the part that should not have to exist. There is no event for
"this view can now take focus", so an application has to poll a native method and
watch for a side effect to know whether it worked.

## Time lost

About three hours, over four APIs and six build-install-observe cycles. Two of
those cycles went on building an on-screen probe, because `KPLogger` output never
appeared in `vega device start-log-stream` from a Release build — at info, where
the log itself reports suppressing a thousand lines at that level, or at warning,
where nothing appeared at all while the platform's own W3CMEDIA lines kept
flowing. See 006: on this platform the screen is still the only instrument.
