/**
 * First-run walkthrough. Shown once, skippable, re-openable from Settings.
 *
 * Each card carries an illustration of what it is describing. They are drawn
 * rather than photographed: a diagram of the screen made from the same tokens
 * as the screen itself cannot drift out of date, needs no asset pipeline, and
 * raises no question about who owns the picture.
 *
 * NOT YET BUILT: the spec ends this on a live preview where the viewer sets
 * their default corner and size before entering the app. That is the premise,
 * and asking once is better than making them discover it — but the cards below
 * only describe. Tracked as remaining work.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, ScreenTitle } from '../components/Text';
import { colour, safeArea, space } from '../design/tokens';

type Illustration = 'place' | 'hide' | 'captions';

const CARDS = [
  {
    title: 'The interpreter is yours to place.',
    body: 'Move the interpreter to whichever corner suits you. Your choice is remembered.',
    illustration: 'place' as Illustration,
  },
  {
    title: "Turn it off when you don't need it.",
    body: 'Others in the room can watch the same programme without it.',
    illustration: 'hide' as Illustration,
  },
  {
    title: 'Captions too, verbatim or simplified.',
    body: 'Simplified captions use shorter, plainer wording at a comfortable reading speed.',
    illustration: 'captions' as Illustration,
  },
] as const;

/**
 * A diagram of a television showing what the card describes.
 *
 * The signer is drawn in amber because that is what focus and emphasis mean
 * everywhere else in this app, and a viewer who cannot distinguish the amber
 * still sees a filled shape against an empty one.
 */
const CardArt = ({ kind }: { kind: Illustration }): React.JSX.Element => (
  <View style={styles.preview}>
    <View style={styles.screen}>
      {kind === 'place' ? (
        <>
          {/* Where it could go, and where it is. */}
          <View style={[styles.signer, styles.signerGhost, styles.topLeft]} />
          <View style={[styles.signer, styles.bottomRight]} />
        </>
      ) : null}

      {kind === 'hide' ? (
        <View style={[styles.signer, styles.signerGhost, styles.bottomRight]} />
      ) : null}

      {kind === 'captions' ? (
        <>
          <View style={[styles.signer, styles.bottomRight]} />
          {/* Two lines of caption, sitting clear of the signer. */}
          <View style={[styles.captionLine, styles.captionLineOne]} />
          <View style={[styles.captionLine, styles.captionLineTwo]} />
        </>
      ) : null}
    </View>
  </View>
);

export const Walkthrough = ({ onDone }: { onDone: () => void }): React.JSX.Element => {
  const [index, setIndex] = useState(0);
  const card = CARDS[index] ?? CARDS[0];
  const last = index === CARDS.length - 1;

  return (
    <View style={styles.root}>
      <CardArt kind={card.illustration} />
      <ScreenTitle style={styles.title}>{card.title}</ScreenTitle>
      <Body dim style={styles.body}>
        {card.body}
      </Body>

      <View style={styles.dots}>
        {CARDS.map((c, i) => (
          <View key={c.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Focusable
          hasTVPreferredFocus
          style={styles.primary}
          onPress={() => (last ? onDone() : setIndex(index + 1))}
        >
          {() => <Body style={styles.primaryLabel}>{last ? 'Start watching' : 'Next'}</Body>}
        </Focusable>
        <Focusable style={styles.secondary} onPress={onDone}>
          <Body>Skip</Body>
        </Focusable>
      </View>
      <Metadata dim style={styles.hint}>
        You can see this again from Settings.
      </Metadata>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colour.bgBase,
    paddingHorizontal: safeArea.horizontal,
    paddingVertical: safeArea.vertical,
    justifyContent: 'center',
  },
  preview: { height: 380, marginBottom: space(4), justifyContent: 'center' },
  screen: {
    width: 640,
    height: 360,
    borderRadius: 12,
    backgroundColor: colour.bgSurface,
    borderWidth: 2,
    borderColor: colour.borderSubtle,
  },
  signer: {
    position: 'absolute',
    width: 150,
    height: 112,
    borderRadius: 6,
    backgroundColor: colour.accent,
  },
  /** Dashed outline, no fill: a position not currently in use. */
  signerGhost: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colour.textSecondary,
  },
  topLeft: { left: 16, top: 16 },
  bottomRight: { right: 16, bottom: 16 },
  captionLine: {
    position: 'absolute',
    height: 14,
    borderRadius: 7,
    backgroundColor: colour.captionText,
    left: 40,
  },
  captionLineOne: { bottom: 62, width: 380 },
  captionLineTwo: { bottom: 34, width: 250 },
  title: { maxWidth: 1300 },
  body: { marginTop: space(2), maxWidth: 1100 },
  dots: { flexDirection: 'row', marginTop: space(3) },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colour.borderSubtle,
    marginRight: space(1),
  },
  dotActive: { backgroundColor: colour.accent },
  actions: { flexDirection: 'row', marginTop: space(4) },
  primary: {
    backgroundColor: colour.accent,
    paddingHorizontal: space(5),
    paddingVertical: space(2),
  },
  primaryLabel: { color: colour.onAccent },
  secondary: { marginLeft: space(2), paddingHorizontal: space(4), paddingVertical: space(2) },
  hint: { marginTop: space(3) },
});
