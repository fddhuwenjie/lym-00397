import { describe, it, expect } from 'vitest';
import { hydraulicErosion } from '../src/terrain/erosion';
import type { ErosionParams } from '../src/types/terrain';
import { generateHeightmap } from '../src/terrain/heightmap';
import type { NoiseParams } from '../src/types/terrain';

describe('Hydraulic Erosion', () => {
  const baseParams: NoiseParams = {
    seed: 42,
    amplitude: 1,
    frequency: 0.01,
    octaves: 4,
    lacunarity: 2,
    persistence: 0.5,
    noiseType: 'perlin',
    fractalType: 'fbm',
  };

  const erosionParams: ErosionParams = {
    droplets: 1000,
    erosionRate: 0.3,
    depositionRate: 0.3,
    lifetime: 30,
  };

  it('hydraulicErosion returns Float32Array with same dimensions', () => {
    const width = 64;
    const height = 64;
    const { data: heightmap } = generateHeightmap(baseParams, width, height);
    const result = hydraulicErosion(heightmap, width, height, erosionParams);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(width * height);
  });

  it('erosion modifies the heightmap (output differs from input)', () => {
    const width = 64;
    const height = 64;
    const { data: heightmap } = generateHeightmap(baseParams, width, height);
    const result = hydraulicErosion(heightmap, width, height, erosionParams);

    let changed = false;
    for (let i = 0; i < heightmap.length; i++) {
      if (Math.abs(heightmap[i] - result[i]) > 0.0001) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it('erosion with 0 droplets returns unchanged heightmap', () => {
    const width = 32;
    const height = 32;
    const { data: heightmap } = generateHeightmap(baseParams, width, height);
    const params = { ...erosionParams, droplets: 0 };
    const result = hydraulicErosion(heightmap, width, height, params);

    for (let i = 0; i < heightmap.length; i++) {
      expect(result[i]).toBe(heightmap[i]);
    }
  });

  it('progress callback is called during erosion', () => {
    const width = 32;
    const height = 32;
    const { data: heightmap } = generateHeightmap(baseParams, width, height);
    const params = { ...erosionParams, droplets: 100 };

    let progressCalled = false;
    let maxProgress = 0;

    hydraulicErosion(heightmap, width, height, params, (percent) => {
      progressCalled = true;
      maxProgress = Math.max(maxProgress, percent);
    });

    expect(progressCalled).toBe(true);
    expect(maxProgress).toBeGreaterThan(0);
    expect(maxProgress).toBeLessThanOrEqual(100);
  });

  it('more droplets produce more erosion', () => {
    const width = 64;
    const height = 64;
    const { data: heightmap } = generateHeightmap(baseParams, width, height);

    const fewDroplets = hydraulicErosion(heightmap, width, height, {
      ...erosionParams,
      droplets: 100,
    });

    const manyDroplets = hydraulicErosion(heightmap, width, height, {
      ...erosionParams,
      droplets: 5000,
    });

    let fewDiff = 0;
    let manyDiff = 0;

    for (let i = 0; i < heightmap.length; i++) {
      fewDiff += Math.abs(heightmap[i] - fewDroplets[i]);
      manyDiff += Math.abs(heightmap[i] - manyDroplets[i]);
    }

    expect(manyDiff).toBeGreaterThan(fewDiff);
  });
});
