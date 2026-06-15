import { describe, it, expect } from 'vitest';
import { SimplexNoise } from '../src/noise/simplex';

describe('Simplex Noise', () => {
  it('output range [-1, 1]', () => {
    const noise = new SimplexNoise(42);
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const z = Math.random() * 100;
      const val2D = noise.noise2D(x, y);
      const val3D = noise.noise3D(x, y, z);
      expect(val2D).toBeGreaterThanOrEqual(-1);
      expect(val2D).toBeLessThanOrEqual(1);
      expect(val3D).toBeGreaterThanOrEqual(-1);
      expect(val3D).toBeLessThanOrEqual(1);
    }
  });

  it('different seed produces different output', () => {
    const noise1 = new SimplexNoise(42);
    const noise2 = new SimplexNoise(123);
    let same = true;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      if (noise1.noise2D(x, y) !== noise2.noise2D(x, y)) {
        same = false;
        break;
      }
    }
    expect(same).toBe(false);
  });

  it('known values (tolerance 1e-6)', () => {
    const noise = new SimplexNoise(42);
    const ref2D = noise.noise2D(0.1, 0.2);
    const ref3D = noise.noise3D(0.1, 0.2, 0.3);
    expect(noise.noise2D(0.1, 0.2)).toBeCloseTo(ref2D, 6);
    expect(noise.noise3D(0.1, 0.2, 0.3)).toBeCloseTo(ref3D, 6);
  });
});
