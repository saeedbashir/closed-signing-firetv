/**
 * Reduce motion.
 *
 * Tested because the failure mode is silence. The setting existed, persisted,
 * and did nothing for weeks — `Focusable` declared the prop and never read it,
 * and nothing ever passed it. Nothing failed, no test went red, and the only
 * symptom was a viewer who needed it being no better off.
 */
import { prefersReducedMotion, setReduceMotion } from '../src/design/motion';

describe('the reduce motion setting', () => {
  afterEach(() => setReduceMotion(false));

  it('is off by default, because most viewers want the focus animation', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('turns on and stays on', () => {
    setReduceMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('turns back off', () => {
    setReduceMotion(true);
    setReduceMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});
