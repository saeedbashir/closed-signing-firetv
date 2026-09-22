/**
 * Where the signer layer and the captions sit, given the viewer's preferences.
 *
 * Kept separate from the components that render them because the collision
 * rule between the two is the fiddly part, and it is far easier to reason
 * about — and to test — as arithmetic than as JSX.
 */
import {
  layout,
  safeArea,
  signerInset,
  signerSize,
  type SignerCorner,
  type SignerSize,
} from './tokens';
import { px } from './scale';
import { SCREEN } from './scale';

export type Box = { left: number; top: number; width: number; height: number };

// The logical window, not the panel resolution. See design/scale.ts — the two
// differ by the device's scale factor and conflating them doubled every layout.
export { SCREEN } from './scale';

/**
 * The signer layer's box for a given corner and size.
 *
 * `aspect` is the crop's width divided by its height, taken from the manifest.
 * Height follows the crop rather than being fixed, because a signer track cut
 * from a side panel is tall and one cut from a corner inset is nearly square.
 */
export function signerBox(
  corner: SignerCorner,
  size: SignerSize,
  aspect: number,
  screen: { width: number; height: number } = SCREEN,
): Box {
  const width = Math.round(screen.width * signerSize[size]);
  const height = Math.round(width / (aspect > 0 ? aspect : 1));
  const left = corner.endsWith('left')
    ? safeArea.horizontal + signerInset
    : screen.width - safeArea.horizontal - signerInset - width;
  const top = corner.startsWith('top')
    ? safeArea.vertical + signerInset
    : screen.height - safeArea.vertical - signerInset - height;
  return { left, top, width, height };
}

export type CaptionPlacement = { bottom: number; left: number; right: number };

/**
 * Where captions go so they never collide with the signer.
 *
 * Captions default to bottom-centre above the safe area. When the signer sits
 * in a bottom corner they would overlap, so captions shift horizontally to the
 * opposite side. When the signer is tall enough that shifting sideways still
 * leaves too little room, they move above it instead.
 *
 * This matters more than it looks. Both layers together outperform either
 * alone — captions added to sign language interpretation raised comprehension
 * by 24% among deaf viewers in one study — so the two must coexist, not
 * compete for the same pixels.
 */
export function captionPlacement(
  signer: Box | null,
  screen: { width: number; height: number } = SCREEN,
  minTextWidth = px(720),
  /**
   * Height of the transport bar when it is showing, 0 when it is not.
   *
   * Captions and transport controls both want the bottom of the screen. The
   * signer at least stays put; the transport bar arrives and leaves while the
   * viewer is reading, so captions lift over it and settle back.
   */
  chromeHeight = 0,
): CaptionPlacement {
  const lift = Math.max(0, chromeHeight);
  const base = {
    bottom: safeArea.vertical + lift,
    left: safeArea.horizontal,
    right: safeArea.horizontal,
  };
  if (!signer) return base;

  const signerBottom = signer.top + signer.height;
  const overlapsCaptionBand = signerBottom > screen.height - safeArea.vertical - px(160);
  if (!overlapsCaptionBand) return base;

  const signerIsLeft = signer.left < screen.width / 2;
  const shifted = signerIsLeft
    ? { ...base, left: signer.left + signer.width + px(48) }
    : { ...base, right: screen.width - signer.left + px(48) };

  const remaining = screen.width - shifted.left - shifted.right;
  if (remaining >= minTextWidth) return shifted;

  // Too narrow beside the signer: go above it instead. Already clear of the
  // transport bar, so no further lift.
  return { ...base, bottom: Math.max(base.bottom, screen.height - signer.top + px(24)) };
}

/** Card position within a rail, used for the focus scroll offset. */
export function railItemOffset(index: number): number {
  return index * (layout.card.width + layout.railGutter);
}
