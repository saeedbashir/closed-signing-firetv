import { signerTimeFor } from '../src/playback/sync';

describe('signerTimeFor', () => {
  it('is the same clock with no offset', () => {
    expect(signerTimeFor(42, 0)).toBe(42);
  });
  it('a positive offset puts the signer behind the programme', () => {
    // Interpretation lags speech: at 10 s of programme the signer is at 9.75 s.
    expect(signerTimeFor(10, 250)).toBe(9.75);
  });
  it('a negative offset puts the signer ahead', () => {
    expect(signerTimeFor(10, -500)).toBe(10.5);
  });
  it('never asks for a time before the start', () => {
    expect(signerTimeFor(0, 250)).toBe(0);
    expect(signerTimeFor(0.1, 250)).toBe(0);
  });
});
