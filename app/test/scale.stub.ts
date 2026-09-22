/**
 * The scale bridge, fixed to the design's own reference screen, for tests.
 *
 * `design/scale.ts` reads React Native's logical window. Under Jest that is a
 * 750x1334 phone and cannot be overridden — `Dimensions.set` has no effect on
 * the Kepler mock, whether called from setupFiles or setupFilesAfterEnv. Left
 * alone, every token in a test reads as 39% of the number the designer wrote,
 * which makes assertions unreadable and hides real errors behind arithmetic.
 *
 * Jest maps `./scale` to this file, so the factor is exactly 1 and a token
 * asserted as 96 is 96.
 *
 * What this does NOT test is the conversion itself. That has to be checked on
 * a device, because the bug it exists to prevent — a 960x540 logical window on
 * a 1920x1080 panel — is invisible to any test that shares the assumption.
 */
export const REFERENCE = { width: 1920, height: 1080 } as const;
export const SCREEN: { width: number; height: number } = { ...REFERENCE };
export const FACTOR = 1;
export const px = (reference: number): number => Math.round(reference);
