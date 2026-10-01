/**
 * The badge on a catalogue card: which signed language, and how sure we are.
 *
 * A title whose extraction confidence is low is still listed, badged
 * differently rather than hidden. A wrong crop that ships silently is worse
 * than one the viewer was warned about.
 */
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {colour, space} from '../design/tokens';
import {Metadata} from './Text';
import type {Caption} from '../stm/types';
import {px} from '../design/scale';

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

/** The caption modes a title offers, in the order the caption menu lists them. */
export function captionModes(
  captions: readonly Caption[] | undefined,
): string[] {
  const kinds = new Set((captions ?? []).map((c) => c.kind));
  return (['verbatim', 'simplified'] as const)
    .filter((k) => kinds.has(k))
    .map((k) => (k === 'verbatim' ? 'Verbatim' : 'Simplified'));
}

/**
 * Which caption modes a title has, so the viewer knows before pressing Play.
 *
 * "CC" on its own is the card's compact form when there is only a verbatim
 * track; with a simplified track the card says so, because that mode is the
 * one most players do not have.
 */
export const CaptionBadge = ({
  captions,
  compact = false,
}: {
  captions: readonly Caption[] | undefined;
  compact?: boolean;
}): React.JSX.Element | null => {
  const modes = captionModes(captions);
  if (modes.length === 0) return null;
  const label = compact
    ? modes.includes('Simplified')
      ? 'CC · Simplified'
      : 'CC'
    : `Captions: ${modes.join(' · ')}`;
  return (
    <View
      style={[styles.badge, styles.captions]}
      accessible
      accessibilityLabel={`Captions available: ${modes
        .join(' and ')
        .toLowerCase()}`}>
      <Metadata style={styles.text}>{label}</Metadata>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space(1.5),
    paddingVertical: space(0.5),
    borderRadius: px(6),
    borderLeftWidth: 4,
    backgroundColor: colour.bgRaised,
  },
  good: {borderLeftColor: colour.stateGood},
  warn: {borderLeftColor: colour.stateWarn},
  captions: {borderLeftColor: colour.textSecondary},
  text: {color: colour.textPrimary},
});
