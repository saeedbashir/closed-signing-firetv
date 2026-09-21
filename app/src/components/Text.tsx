/**
 * Typography components, so no screen sets a font size by hand.
 *
 * 24px is the floor and nothing smaller ships. That is not a style preference:
 * this is a 1080p screen read from about three metres by someone who may be
 * relying on the app for access.
 */
import React from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { colour, type } from '../design/tokens';

type Props = RNTextProps & { dim?: boolean; children: React.ReactNode };

const make = (variant: keyof typeof type) =>
  function Variant({ dim, style, children, ...rest }: Props): React.JSX.Element {
    return (
      <RNText
        {...rest}
        style={[
          type[variant],
          { color: dim ? colour.textSecondary : colour.textPrimary },
          style,
        ]}
      >
        {children}
      </RNText>
    );
  };

export const ScreenTitle = make('screenTitle');
export const SectionHeading = make('sectionHeading');
export const CardTitle = make('cardTitle');
export const Body = make('body');
export const Metadata = make('metadata');

export const styles = StyleSheet.create({});
