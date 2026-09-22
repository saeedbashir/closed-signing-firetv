/**
 * A diagram of a television with the interpreter where the viewer has put her.
 *
 * Drawn from the same tokens as the player — `signerSize` sets her width as a
 * fraction of the screen, the corner comes from the preference — so what the
 * diagram promises is what the player does. Used on the last walkthrough card,
 * where the viewer sets their defaults before ever pressing Play, and beside
 * the Interpreter settings, where they change them later. One drawing, two
 * places, no drift.
 *
 * The signer is amber because amber is what emphasis means everywhere in this
 * app, and a viewer who cannot distinguish the amber still sees a filled shape
 * against three empty ones.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  colour,
  signerCorners,
  signerSize,
  type SignerCorner,
  type SignerSize,
} from '../design/tokens';
import { px } from '../design/scale';

export type DiagramBox = { left: number; top: number; width: number; height: number };

/**
 * The signer rectangle inside a diagram of the given width. Pure, so the
 * arithmetic that says "bottom-right, medium" really lands bottom-right at a
 * medium size can be checked without rendering anything.
 */
export function diagramBox(
  corner: SignerCorner,
  size: SignerSize,
  screenWidth: number,
  screenHeight: number,
  inset: number,
  aspect = 1.1,
): DiagramBox {
  const width = Math.round(screenWidth * signerSize[size]);
  const height = Math.round(width / aspect);
  const left = corner.endsWith('left') ? inset : screenWidth - inset - width;
  const top = corner.startsWith('top') ? inset : screenHeight - inset - height;
  return { left, top, width, height };
}

export const LayoutDiagram = ({
  corner,
  size,
  width = px(560),
  captions = false,
  ghosts = true,
}: {
  corner: SignerCorner;
  size: SignerSize;
  /** The diagram's width in logical pixels; height follows at 16:9. */
  width?: number;
  /** Draw two caption lines, clear of the signer. */
  captions?: boolean;
  /** Draw the other three corners as dashed outlines: where she could be. */
  ghosts?: boolean;
}): React.JSX.Element => {
  const height = Math.round((width * 9) / 16);
  const inset = Math.round(width * 0.03);
  const box = diagramBox(corner, size, width, height, inset);
  const ghostSize: SignerSize = 'small';
  return (
    <View
      style={[styles.screen, { width, height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Interpreter ${corner.replace('-', ' ')}, ${size}`}
    >
      {ghosts
        ? signerCorners
            .filter((c) => c !== corner)
            .map((c) => {
              const g = diagramBox(c, ghostSize, width, height, inset);
              return <View key={c} style={[styles.ghost, g]} />;
            })
        : null}
      <View style={[styles.signer, box]} />
      {captions ? (
        <>
          <View
            style={[
              styles.caption,
              {
                bottom: inset + Math.round(height * 0.12),
                width: Math.round(width * 0.42),
                left: corner.endsWith('left') ? box.left + box.width + inset : inset * 2,
              },
            ]}
          />
          <View
            style={[
              styles.caption,
              {
                bottom: inset + Math.round(height * 0.04),
                width: Math.round(width * 0.3),
                left: corner.endsWith('left') ? box.left + box.width + inset : inset * 2,
              },
            ]}
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    borderRadius: px(12),
    backgroundColor: colour.bgSurface,
    borderWidth: px(2),
    borderColor: colour.borderSubtle,
    overflow: 'hidden',
  },
  signer: { position: 'absolute', borderRadius: px(6), backgroundColor: colour.accent },
  ghost: {
    position: 'absolute',
    borderRadius: px(6),
    borderWidth: px(2),
    borderStyle: 'dashed',
    borderColor: colour.textSecondary,
  },
  caption: {
    position: 'absolute',
    height: px(12),
    borderRadius: px(6),
    backgroundColor: colour.captionText,
  },
});
