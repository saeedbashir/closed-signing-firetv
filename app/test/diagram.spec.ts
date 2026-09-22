import { diagramBox } from '../src/components/LayoutDiagram';
import { signerSize } from '../src/design/tokens';

const W = 800;
const H = 450;
const INSET = 24;

describe('the layout diagram puts the signer where the preference says', () => {
  it('bottom-right sits against the bottom and right insets', () => {
    const b = diagramBox('bottom-right', 'medium', W, H, INSET);
    expect(b.left + b.width).toBe(W - INSET);
    expect(b.top + b.height).toBe(H - INSET);
  });
  it('top-left sits against the top and left insets', () => {
    const b = diagramBox('top-left', 'medium', W, H, INSET);
    expect(b.left).toBe(INSET);
    expect(b.top).toBe(INSET);
  });
  it('width follows the same fraction the player uses', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      expect(diagramBox('bottom-right', size, W, H, INSET).width).toBe(
        Math.round(W * signerSize[size]),
      );
    }
  });
  it('sizes are ordered', () => {
    const w = (s: 'small' | 'medium' | 'large') => diagramBox('top-right', s, W, H, INSET).width;
    expect(w('small')).toBeLessThan(w('medium'));
    expect(w('medium')).toBeLessThan(w('large'));
  });
});
