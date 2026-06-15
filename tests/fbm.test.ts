import { describe, it, expect } from 'vitest';
import { fbm, ridged } from '../src/noise/fbm';
import { PerlinNoise } from '../src/noise/perlin';

describe('fBm and Ridged', () => {
  const noise = new PerlinNoise(42);
  const baseParams = {
    octaves: 1,
    lacunarity: 2,
    persistence: 0.5,
    frequency: 0.01,
    amplitude: 1,
  };

  it('fBm with octaves=1 equals base noise output (same params)', () => {
    const params = { ...baseParams, octaves: 1 };
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const fbmVal = fbm(noise, x, y, params);
        const noiseVal = noise.noise2D(x * params.frequency, y * params.frequency);
        expect(fbmVal).toBeCloseTo(noiseVal, 10);
      }
    }
  });

  it('fBm with octaves=4 produces different output than octaves=1', () => {
    const params1 = { ...baseParams, octaves: 1 };
    const params4 = { ...baseParams, octaves: 4 };
    let different = false;
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const val1 = fbm(noise, x, y, params1);
        const val4 = fbm(noise, x, y, params4);
        if (Math.abs(val1 - val4) > 0.0001) {
          different = true;
          break;
        }
      }
      if (different) break;
    }
    expect(different).toBe(true);
  });

  it('ridged output range is [0, 1] after normalization', () => {
    const params = { ...baseParams, octaves: 4 };
    for (let x = 0; x < 100; x++) {
      for (let y = 0; y < 100; y++) {
        const val = ridged(noise, x, y, params);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('fBm output range is [-1, 1] for normalized input', () => {
    const params = { ...baseParams, octaves: 4 };
    for (let x = 0; x < 100; x++) {
      for (let y = 0; y < 100; y++) {
        const val = fbm(noise, x, y, params);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('deterministic: same params produce same output', () => {
    const params = { ...baseParams, octaves: 4 };
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const val1 = fbm(noise, x, y, params);
        const val2 = fbm(noise, x, y, params);
        expect(val1).toBe(val2);
        const rval1 = ridged(noise, x, y, params);
        const rval2 = ridged(noise, x, y, params);
        expect(rval1).toBe(rval2);
      }
    }
  });
});
