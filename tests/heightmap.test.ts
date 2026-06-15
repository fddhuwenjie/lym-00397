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
    const heightmap = generateHeightmap(baseParams, width, height);
    expect(heightmap.length).toBe(width * height);
    expect(heightmap instanceof Float32Array).toBe(true);

    const hash = sha256Float32Array(heightmap);
    const expectedHash = 'c42917743ec8f65047c043a960d49bd8366abff1e2d92a409a2803e306f6136b';

    expect(hash).toBe(expectedHash);
  });

  it('different seeds produce different hashes', () => {
    const width = 64;
    const height = 64;
    const params1 = { ...baseParams, seed: 42 };
    const params2 = { ...baseParams, seed: 123 };
    const heightmap1 = generateHeightmap(params1, width, height);
    const heightmap2 = generateHeightmap(params2, width, height);
    const hash1 = sha256Float32Array(heightmap1);
    const hash2 = sha256Float32Array(heightmap2);
    expect(hash1).not.toBe(hash2);
  });

  it('1024x1024 heightmap doesn\'t error and completes', () => {
    const width = 1024;
    const height = 1024;
    const heightmap = generateHeightmap(baseParams, width, height);
    expect(heightmap.length).toBe(width * height);
    expect(heightmap instanceof Float32Array).toBe(true);
  });
});
