import { describe, expect, it } from 'vitest';
import { normalizeMacAddress } from './mac.util.js';

describe('normalizeMacAddress', () => {
  it('trims whitespace', () => {
    expect(normalizeMacAddress('  00:1a:2b:3c:4d:5e  ')).toBe('00:1A:2B:3C:4D:5E');
  });

  it('converts to uppercase', () => {
    expect(normalizeMacAddress('00:1a:2b:3c:4d:5e')).toBe('00:1A:2B:3C:4D:5E');
  });

  it('replaces dashes with colons', () => {
    expect(normalizeMacAddress('00-1A-2B-3C-4D-5E')).toBe('00:1A:2B:3C:4D:5E');
  });

  it('handles mixed separators', () => {
    expect(normalizeMacAddress('00-1A:2B-3C:4D-5E')).toBe('00:1A:2B:3C:4D:5E');
  });

  it('handles lowercase with dashes', () => {
    expect(normalizeMacAddress('aa-bb-cc-dd-ee-ff')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('handles already normalized', () => {
    expect(normalizeMacAddress('00:1A:2B:3C:4D:5E')).toBe('00:1A:2B:3C:4D:5E');
  });

  it.each([
    ['00:1a:2b:3c:4d:5e', '00:1A:2B:3C:4D:5E'],
    ['00-1a-2b-3c-4d-5e', '00:1A:2B:3C:4D:5E'],
    ['  00-1a-2b-3c-4d-5e  ', '00:1A:2B:3C:4D:5E'],
    ['AA-BB-CC-DD-EE-FF', 'AA:BB:CC:DD:EE:FF'],
  ])('normalizeMacAddress(%s) => %s', (input, expected) => {
    expect(normalizeMacAddress(input)).toBe(expected);
  });
});
