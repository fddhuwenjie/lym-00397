import { describe, it, expect } from 'vitest';
import { mulberry32, createPermTable } from '../src/noise/prng';

describe('PRNG', () => {
  describe('mulberry32', () => {
    it('same seed produces same sequence', () => {
      const rng1 = mulberry32(42);
      const rng2 = mulberry32(42);
      for (let i = 0; i < 100; i++) {
        expect(rng1()).toBe(rng2());
      }
    });

    it('different seeds produce different sequences', () => {
      const rng1 = mulberry32(42);
      const rng2 = mulberry32(123);
      let same = true;
      for (let i = 0; i < 100; i++) {
        if (rng1() !== rng2()) {
          same = false;
          break;
        }
      }
      expect(same).toBe(false);
    });

    it('known seed=42, first 5 outputs match expected values', () => {
      const rng = mulberry32(42);
      const expected = [0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423];
      for (let i = 0; i < 5; i++) {
        expect(rng()).toBeCloseTo(expected[i], 15);
      }
    });
  });

  describe('createPermTable', () => {
    it('same seed produces same permutation', () => {
      const perm1 = createPermTable(42);
      const perm2 = createPermTable(42);
      expect(perm1.length).toBe(512);
      expect(perm2.length).toBe(512);
      for (let i = 0; i < 512; i++) {
        expect(perm1[i]).toBe(perm2[i]);
      }
    });

    it('permutation contains all values 0-255 exactly once', () => {
      const perm = createPermTable(42);
      const counts = new Map<number, number>();
      for (let i = 0; i < 256; i++) {
        const val = perm[i];
        counts.set(val, (counts.get(val) || 0) + 1);
      }
      expect(counts.size).toBe(256);
      for (let i = 0; i < 256; i++) {
        expect(counts.get(i)).toBe(1);
      }
    });
  });
});
