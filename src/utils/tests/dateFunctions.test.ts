import { describe, it, expect } from 'vitest';
import { currentYear } from '../dateFunctions';

describe('currentYear()', () => {
  it('returns current date year', async () => {
    expect(currentYear()).toEqual(new Date().getFullYear().toString());
  });
});
