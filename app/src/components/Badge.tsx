/**
 * The badge on a catalogue card: which signed language, and how sure we are.
 *
 * A title whose extraction confidence is low is still listed, badged
 * differently rather than hidden. A wrong crop that ships silently is worse
 * than one the viewer was warned about.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colour, space } from '../design/tokens';
import { Metadata } from './Text';

export const SignLanguageBadge = ({
  languages,
  lowConfidence,
}: {
  languages: string[];
  lowConfidence: boolean;
}): React.JSX.Element | null => {
  if (languages.length === 0) return null;
  const label = languages.map((l) => l.toUpperCase()).join(' · ');
  return (
    <View style={[styles.badge, lowConfidence ? styles.warn : styles.good]}>
      <Metadata style={styles.text}>
        {label}
        {lowConfidence ? '  check' : ''}
      </Metadata>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space(1.5),
    paddingVertical: space(0.5),
    borderRadius: 6,
    borderLeftWidth: 4,
    backgroundColor: colour.bgRaised,
  },
  good: { borderLeftColor: colour.stateGood },
  warn: { borderLeftColor: colour.stateWarn },
  text: { color: colour.textPrimary },
});
