import {describe, it, expect} from 'vitest';
import {formatDimensions} from '@/lib/dimensions';

describe('formatDimensions', () => {
  it('adds cm to a bare number', () => {
    expect(formatDimensions('300')).toBe('300 cm');
  });

  it('formats legacy "NxN" pair with spaces and cm', () => {
    expect(formatDimensions('140x250')).toBe('140 cm × 250 cm');
  });

  it('keeps a single cm value and normalizes spacing', () => {
    expect(formatDimensions('140cm')).toBe('140 cm');
  });

  it('normalizes spacing around × and cm', () => {
    expect(formatDimensions('300cm×140cm')).toBe('300 cm × 140 cm');
  });

  it('leaves already-formatted values unchanged', () => {
    expect(formatDimensions('300 cm × 140 cm')).toBe('300 cm × 140 cm');
  });

  it('keeps non-cm units (e.g. meters) with normalized spacing', () => {
    expect(formatDimensions('3m×140cm')).toBe('3 m × 140 cm');
  });

  it('handles an empty value', () => {
    expect(formatDimensions('')).toBe('');
    expect(formatDimensions('   ')).toBe('');
  });
});