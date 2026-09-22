/**
 * First-run walkthrough. Shown once, skippable, re-openable from Settings.
 *
 * Three cards describe, and the fourth lets the viewer do: they put the
 * interpreter where they want her and choose her size against a live diagram
 * before the first title ever plays. That is the premise of the product —
 * "your layout, set once" — and asking once is better than making them
 * discover the overlay. Skip keeps the defaults; nothing is lost either way.
 *
 * Each card carries an illustration of what it is describing, drawn from the
 * same tokens as the screen itself, so a diagram cannot drift out of date,
 * needs no asset pipeline, and raises no question about who owns the picture.
 */
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, findNodeHandle } from 'react-native';
import { Focusable, type FocusableHost } from '../components/Focusable';
import { LayoutDiagram } from '../components/LayoutDiagram';
import { Body, Metadata, ScreenTitle } from '../components/Text';
import { colour, safeArea, signerCorners, space, type SignerSize } from '../design/tokens';
import { cycle, type Preferences } from '../state/preferences';
import { useOverlayValueKeys } from '../input/remote';
import { px } from '../design/scale';

type Illustration = 'place' | 'hide' | 'captions' | 'choose';

const SIZES: readonly SignerSize[] = ['small', 'medium', 'large'];
const SIZE_LABEL: Record<SignerSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
const CORNER_LABEL: Record<string, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
};

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
  {
    title: 'Where would you like her?',
    body: 'Choose a corner and a size now. You can change them any time while watching, with Up on the remote.',
    illustration: 'choose' as Illustration,
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

/** A row whose value changes with Left and Right, as in the player's overlays. */
const ChoiceRow = ({
  label,
  value,
  rowKey,
  onFocused,
  onChange,
  first,
  nextFocusDown,
  onHostRef,
}: {
  label: string;
  value: string;
  rowKey: string;
  onFocused: (key: string) => void;
  onChange: (delta: number) => void;
  /** Takes the focus when the card appears, so Left and Right work at once. */
  first?: boolean;
  nextFocusDown?: number;
  onHostRef?: (node: FocusableHost | null) => void;
}): React.JSX.Element => (
  <Focusable
    style={styles.choiceRow}
    scaleOnFocus={false}
    claimsFocus={first}
    nextFocusDown={nextFocusDown}
    onHostRef={onHostRef}
    accessibilityLabel={label}
    accessibilityRole="adjustable"
    accessibilityValue={{ text: value }}
    accessibilityHint="Left and right to change"
    onPress={() => onChange(1)}
    onFocusChange={(focused) => {
      if (focused) onFocused(rowKey);
    }}
  >
    {(focused) => (
      <View style={styles.choiceInner}>
        <Body dim={!focused}>{label}</Body>
        <View style={styles.valueGroup}>
          <Metadata dim={!focused} style={styles.chevron}>
            {focused ? '‹' : ' '}
          </Metadata>
          <Body>{value}</Body>
          <Metadata dim={!focused} style={styles.chevron}>
            {focused ? '›' : ' '}
          </Metadata>
        </View>
      </View>
    )}
  </Focusable>
);

export const Walkthrough = ({
  prefs,
  onChange,
  onDone,
}: {
  prefs: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  onDone: () => void;
}): React.JSX.Element => {
  const [index, setIndex] = useState(0);
  const card = CARDS[index] ?? CARDS[0];
  const last = index === CARDS.length - 1;
  const choosing = card.illustration === 'choose';

  // Left and Right act on whichever row has focus — the same arrangement as
  // the overlays and Settings, and for the same stale-closure reason.
  const focusedKey = useRef<string | null>(null);
  const onFocused = useCallback((key: string) => {
    focusedKey.current = key;
  }, []);
  const handlers: Record<string, (delta: number) => void> = {
    corner: (d) => onChange({ signerCorner: cycle(signerCorners, prefs.signerCorner, d) }),
    size: (d) => onChange({ signerSize: cycle(SIZES, prefs.signerSize, d) }),
  };
  const live = useRef(handlers);
  live.current = handlers;
  useOverlayValueKeys((delta) => {
    const key = focusedKey.current;
    if (key) live.current[key]?.(delta);
  }, choosing);

  // Down from the Size row goes to the primary button and Up comes back, so
  // "Down, Select" on this card does what the viewer meant.
  const [startHandle, setStartHandle] = useState<number | undefined>(undefined);
  const [sizeHandle, setSizeHandle] = useState<number | undefined>(undefined);
  const handleOf = (node: FocusableHost | null) =>
    node ? findNodeHandle(node) ?? undefined : undefined;

  return (
    <View style={styles.root}>
      {choosing ? (
        <View style={styles.preview}>
          <LayoutDiagram corner={prefs.signerCorner} size={prefs.signerSize} width={px(640)} />
        </View>
      ) : (
        <CardArt kind={card.illustration} />
      )}
      <ScreenTitle style={styles.title}>{card.title}</ScreenTitle>
      <Body dim style={styles.body}>
        {card.body}
      </Body>

      {choosing ? (
        <View style={styles.choices}>
          <ChoiceRow
            first
            label="Position"
            value={CORNER_LABEL[prefs.signerCorner] ?? prefs.signerCorner}
            rowKey="corner"
            onFocused={onFocused}
            onChange={handlers.corner}
          />
          <ChoiceRow
            label="Size"
            value={SIZE_LABEL[prefs.signerSize]}
            rowKey="size"
            onFocused={onFocused}
            onChange={handlers.size}
            nextFocusDown={startHandle}
            onHostRef={(n) => setSizeHandle(handleOf(n))}
          />
        </View>
      ) : null}

      <View style={styles.dots}>
        {CARDS.map((c, i) => (
          <View key={c.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Focusable
          hasTVPreferredFocus={!choosing}
          claimsFocus={!choosing}
          nextFocusUp={choosing ? sizeHandle : undefined}
          onHostRef={(n) => setStartHandle(handleOf(n))}
          variant="primary"
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
  preview: { height: px(380), marginBottom: space(4), justifyContent: 'center' },
  screen: {
    width: px(640),
    height: px(360),
    borderRadius: px(12),
    backgroundColor: colour.bgSurface,
    borderWidth: px(2),
    borderColor: colour.borderSubtle,
  },
  signer: {
    position: 'absolute',
    width: px(150),
    height: px(112),
    borderRadius: px(6),
    backgroundColor: colour.accent,
  },
  /** Dashed outline, no fill: a position not currently in use. */
  signerGhost: {
    backgroundColor: 'transparent',
    borderWidth: px(2),
    borderStyle: 'dashed',
    borderColor: colour.textSecondary,
  },
  topLeft: { left: px(16), top: px(16) },
  bottomRight: { right: px(16), bottom: px(16) },
  captionLine: {
    position: 'absolute',
    height: px(14),
    borderRadius: px(7),
    backgroundColor: colour.captionText,
    left: px(40),
  },
  captionLineOne: { bottom: px(62), width: px(380) },
  captionLineTwo: { bottom: px(34), width: px(250) },
  title: { maxWidth: px(1300) },
  body: { marginTop: space(2), maxWidth: px(1100) },
  choices: { marginTop: space(3), maxWidth: px(800) },
  choiceRow: { paddingHorizontal: space(2), paddingVertical: space(1.5), marginBottom: space(1) },
  choiceInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: px(28), textAlign: 'center' },
  dots: { flexDirection: 'row', marginTop: space(3) },
  dot: {
    width: px(14),
    height: px(14),
    borderRadius: px(7),
    backgroundColor: colour.borderSubtle,
    marginRight: space(1),
  },
  dotActive: { backgroundColor: colour.accent },
  actions: { flexDirection: 'row', marginTop: space(4) },
  primary: { paddingHorizontal: space(5), paddingVertical: space(2) },
  primaryLabel: { color: colour.onAccent },
  secondary: { marginLeft: space(2), paddingHorizontal: space(4), paddingVertical: space(2) },
  hint: { marginTop: space(3) },
});
