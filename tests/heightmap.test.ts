import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { generateHeightmap } from '../src/terrain/heightmap';
import type { NoiseParams } from '../src/types/terrain';

describe('Heightmap', () => {
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

  function sha256Float32Array(arr: Float32Array): string {
    const hash = createHash('sha256');
    const buffer = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    hash.update(buffer);
    return hash.digest('hex');
  }

  it('generateHeightmap with fixed seed=42, octaves=4 produces expected output', () => {
    const width = 256;
    const height = 256;
    const { data: heightmap, min, max } = generateHeightmap(baseParams, width, height);
    expect(heightmap.length).toBe(width * height);
    expect(heightmap instanceof Float32Array).toBe(true);
    expect(typeof min).toBe('number');
    expect(typeof max).toBe('number');
    expect(min).toBeLessThan(max);

    const hash = sha256Float32Array(heightmap);
    const expectedHash = 'c42917743ec8f65047c043a960d49bd8366abff1e2d92a409a2803e306f6136b';

    expect(hash).toBe(expectedHash);
  });

  it('different seeds produce different hashes', () => {
    const width = 64;
    const height = 64;
    const params1 = { ...baseParams, seed: 42 };
    const params2 = { ...baseParams, seed: 123 };
    const { data: heightmap1 } = generateHeightmap(params1, width, height);
    const { data: heightmap2 } = generateHeightmap(params2, width, height);
    const hash1 = sha256Float32Array(heightmap1);
    const hash2 = sha256Float32Array(heightmap2);
    expect(hash1).not.toBe(hash2);
  });

  it('1024x1024 heightmap doesn\'t error and completes', () => {
    const width = 1024;
    const height = 1024;
    const { data: heightmap, min, max } = generateHeightmap(baseParams, width, height);
    expect(heightmap.length).toBe(width * height);
    expect(heightmap instanceof Float32Array).toBe(true);
    expect(min).toBeLessThan(max);
  });

  it('global min/max normalization produces consistent values across chunks', () => {
    const width = 128;
    const height = 128;
    const chunkSize = 64;

    const { data: fullHeightmap, min: globalMin, max: globalMax } = generateHeightmap(
      baseParams,
      width,
      height,
    );

    const chunk00 = generateHeightmap(baseParams, chunkSize + 1, chunkSize + 1, 0, 0, globalMin, globalMax);
    const chunk10 = generateHeightmap(baseParams, chunkSize + 1, chunkSize + 1, chunkSize, 0, globalMin, globalMax);

    for (let z = 0; z <= chunkSize; z++) {
      const fullLeft = fullHeightmap[z * width + (chunkSize - 1)];
      const fullRight = fullHeightmap[z * width + chunkSize];

      const chunkLeft = chunk00.data[z * (chunkSize + 1) + (chunkSize - 1)];
      const chunkRight = chunk10.data[z * (chunkSize + 1) + 0];

      expect(Math.abs(chunkLeft - fullLeft)).toBeLessThan(1e-6);
      expect(Math.abs(chunkRight - fullRight)).toBeLessThan(1e-6);
      expect(Math.abs(chunk00.data[z * (chunkSize + 1) + chunkSize] - chunk10.data[z * (chunkSize + 1) + 0])).toBeLessThan(1e-6);
    }
  });

  it('tiled generation with global min/max matches single generation', () => {
    const width = 256;
    const height = 256;
    const tileSize = 128;

    const { data: singleHeightmap, min: globalMin, max: globalMax } = generateHeightmap(
      baseParams,
      width,
      height,
    );

    const tiled = new Float32Array(width * height);
    for (let tz = 0; tz < 2; tz++) {
      for (let tx = 0; tx < 2; tx++) {
        const ox = tx * tileSize;
        const oz = tz * tileSize;
        const { data: tile } = generateHeightmap(
          baseParams,
          tileSize,
          tileSize,
          ox,
          oz,
          globalMin,
          globalMax,
        );
        for (let z = 0; z < tileSize; z++) {
          for (let x = 0; x < tileSize; x++) {
            tiled[(oz + z) * width + (ox + x)] = tile[z * tileSize + x];
          }
        }
      }
    }

    const hashSingle = sha256Float32Array(singleHeightmap);
    const hashTiled = sha256Float32Array(tiled);
    expect(hashSingle).toBe(hashTiled);
  });
});
