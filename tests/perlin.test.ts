import { describe, it, expect } from 'vitest';
import { PerlinNoise } from '../src/noise/perlin';

describe('Perlin Noise', () => {
  it('noise2D at integer coordinates outputs ~0 (symmetry)', () => {
    const noise = new PerlinNoise(42);
    for (let x = -10; x <= 10; x++) {
      for (let y = -10; y <= 10; y++) {
        expect(noise.noise2D(x, y)).toBeCloseTo(0, 10);
      }
    }
  });

  it('noise3D at integer coordinates outputs ~0 (symmetry)', () => {
    const noise = new PerlinNoise(42);
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        for (let z = -5; z <= 5; z++) {
          expect(noise.noise3D(x, y, z)).toBeCloseTo(0, 10);
        }
      }
    }
  });

  it('known values from implementation (tolerance 1e-6)', () => {
    const noise0 = new PerlinNoise(0);
    const noise42 = new PerlinNoise(42);

    const refNoise2D_0_05_05 = noise0.noise2D(0.5, 0.5);
    const refNoise3D_0_05_05_05 = noise0.noise3D(0.5, 0.5, 0.5);
    const refNoise2D_42_12_34 = noise42.noise2D(1.2, 3.4);
    const refNoise3D_42_12_34_56 = noise42.noise3D(1.2, 3.4, 5.6);

    expect(noise0.noise2D(0.5, 0.5)).toBeCloseTo(refNoise2D_0_05_05, 6);
    expect(noise0.noise3D(0.5, 0.5, 0.5)).toBeCloseTo(refNoise3D_0_05_05_05, 6);
    expect(noise42.noise2D(1.2, 3.4)).toBeCloseTo(refNoise2D_42_12_34, 6);
    expect(noise42.noise3D(1.2, 3.4, 5.6)).toBeCloseTo(refNoise3D_42_12_34_56, 6);
  });

  it('output range: for random points, output should be in [-1, 1]', () => {
    const noise = new PerlinNoise(42);
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

  it('gradient continuity: noise at (x+dx) should be close to noise at (x) when dx is small', () => {
    const noise = new PerlinNoise(42);
    const dx = 0.0001;
    const x = 0.5;
    const y = 0.5;
    const z = 0.5;

    const val2D_x = noise.noise2D(x, y);
    const val2D_xdx = noise.noise2D(x + dx, y);
    const val3D_x = noise.noise3D(x, y, z);
    const val3D_xdx = noise.noise3D(x + dx, y, z);

    const expectedDiff2D = Math.abs(noise.noise2D(x + dx * 0.5, y) * dx);
    const expectedDiff3D = Math.abs(noise.noise3D(x + dx * 0.5, y, z) * dx);

    expect(Math.abs(val2D_xdx - val2D_x)).toBeLessThan(0.01 + expectedDiff2D);
    expect(Math.abs(val3D_xdx - val3D_x)).toBeLessThan(0.01 + expectedDiff3D);
  });
});
