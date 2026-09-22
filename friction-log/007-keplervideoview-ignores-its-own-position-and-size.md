# 007 — KeplerVideoView ignores position and size applied to itself

**Date:** 2026-09-22
**Area:** media API · RN focus
**Severity:** major

## Task attempted

Composite two video surfaces: a main programme filling the frame, and a cropped
interpreter track positioned in a corner at a size the viewer chooses. This is the
entire product.

## Steps taken

Styled each `KeplerVideoView` directly, the way any React Native view is styled.

```tsx
<KeplerVideoView style={StyleSheet.absoluteFill} videoPlayer={main} scalingmode="fit" />

<KeplerVideoView
  style={[styles.signer, { left: box.left, top: box.top, width: box.width, height: box.height }]}
  videoPlayer={signer}
  scalingmode="fit"
/>
```

## Expected

The main video to fill the screen and the signer to sit where `box` says.

## Actual

The main video rendered at roughly **half the screen in each dimension**, and the signer
drew **centre-screen** rather than at its computed corner.

The geometry was not at fault. An on-screen readout during the same run printed:

```
screen=960x540 box=696,238 192x251 aspect=0.77
```

696 + 192 = 888, which is exactly `960 - 48 - 24` — the right edge less the safe area and
the inset. The numbers were correct and the surface ignored them.

Two further observations, both costly:

- A plain `View` given the same `left/top/width/height` renders exactly where asked. So
  this is specific to the video surface, not to the layout.
- Probe `View`s with only `borderWidth` and no `backgroundColor` did not appear at all,
  which sent me looking for a rendering fault that was not there. Filled views work.
  Worth knowing before you use outlines to debug a layout on this platform.

## Workaround

Put the geometry on an ordinary `View` and let the surface fill it:

```tsx
<View style={StyleSheet.absoluteFill}>
  <KeplerVideoView style={StyleSheet.absoluteFill} videoPlayer={main} scalingmode="fit" />
</View>

<View style={[styles.signer, { left: box.left, top: box.top, width: box.width, height: box.height }]}>
  <KeplerVideoView style={StyleSheet.absoluteFill} videoPlayer={signer} scalingmode="fit" />
</View>
```

Both surfaces then land exactly where intended, and the signer moves correctly when the
viewer changes corner. Verified on device.

## Suggestion

Either honour layout props on `KeplerVideoView`, or say plainly in its documentation
that it must be positioned by a parent. The current behaviour is the worst case: styles
are accepted without error and partially obeyed, so it reads as a bug in your own
geometry. I spent the best part of an hour proving my arithmetic was right before
suspecting the view.

A single line in the component's type definitions would have prevented all of it.

## Time lost

About 90 minutes, most of it re-deriving layout maths that was correct from the start.
