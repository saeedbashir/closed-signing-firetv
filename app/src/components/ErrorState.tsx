/**
 * Every failure shows a plain sentence, no error code, and one focused action.
 *
 * The rule the whole app follows: no dead ends. A title whose signer track
 * fails still plays the main video with a line saying the interpreter is
 * unavailable. Degrade, never block.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colour, safeArea, space } from '../design/tokens';
import { Focusable } from './Focusable';
import { Body, ScreenTitle } from './Text';

export const ErrorState = ({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}): React.JSX.Element => (
  <View style={styles.root}>
    <ScreenTitle>{title}</ScreenTitle>
    <Body dim style={styles.detail}>
      {detail}
    </Body>
    <Focusable onPress={onAction} hasTVPreferredFocus style={styles.button}>
      <Body>{actionLabel}</Body>
    </Focusable>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colour.bgBase,
    justifyContent: 'center',
    paddingHorizontal: safeArea.horizontal,
  },
  detail: { marginTop: space(2), maxWidth: 1100 },
  button: { marginTop: space(4), alignSelf: 'flex-start', paddingHorizontal: space(4), paddingVertical: space(2) },
});
