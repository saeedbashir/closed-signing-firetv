/**
 * First-run walkthrough. Shown once, skippable, re-openable from Settings.
 *
 * It ends on a live preview where the viewer sets their default size and
 * corner before entering the app. Whatever they pick becomes their profile
 * default — which is the whole premise, so it is worth asking once rather
 * than making them discover it.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Focusable } from '../components/Focusable';
import { Body, Metadata, ScreenTitle } from '../components/Text';
import { colour, safeArea, space } from '../design/tokens';

const CARDS = [
  {
    title: 'The interpreter is yours to place.',
    body: 'Move the interpreter to whichever corner suits you. Your choice is remembered.',
  },
  {
    title: "Turn it off when you don't need it.",
    body: 'Others in the room can watch the same programme without it.',
  },
  {
    title: 'Captions too, verbatim or simplified.',
    body: 'Simplified captions use shorter, plainer wording at a comfortable reading speed.',
  },
] as const;

export const Walkthrough = ({ onDone }: { onDone: () => void }): React.JSX.Element => {
  const [index, setIndex] = useState(0);
  const card = CARDS[index] ?? CARDS[0];
  const last = index === CARDS.length - 1;

  return (
    <View style={styles.root}>
      <View style={styles.preview} />
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
  preview: {
    height: 380,
    borderRadius: 12,
    backgroundColor: colour.bgSurface,
    marginBottom: space(4),
  },
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
