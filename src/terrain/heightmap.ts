import { PerlinNoise } from '../noise/perlin';
import { SimplexNoise } from '../noise/simplex';
import { fbm, ridged } from '../noise/fbm';
import type { NoiseParams } from '../types/terrain';
import type { NoiseSource, FbmParams } from '../noise/fbm';

export function generateHeightmap(
  noiseParams: NoiseParams,
  width: number,
  height: number,
  offsetX: number = 0,
  offsetZ: number = 0,
): Float32Array {
  const noise: NoiseSource =
    noiseParams.noiseType === 'perlin'
      ? new PerlinNoise(noiseParams.seed)
      : new SimplexNoise(noiseParams.seed);

  const fractalFn = noiseParams.fractalType === 'fbm' ? fbm : ridged;
  const fbmParams: FbmParams = {
    octaves: noiseParams.octaves,
    lacunarity: noiseParams.lacunarity,
    persistence: noiseParams.persistence,
    frequency: noiseParams.frequency,
    amplitude: noiseParams.amplitude,
  };

  const result = new Float32Array(width * height);

  let min = Infinity;
  let max = -Infinity;

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const nx = (x + offsetX);
      const nz = (z + offsetZ);
      const value = fractalFn(noise, nx, nz, fbmParams);
      result[z * width + x] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] = (result[i] - min) / range;
    }
  }

  return result;
}
