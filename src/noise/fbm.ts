export interface NoiseSource {
  noise2D(x: number, y: number): number;
}

export interface FbmParams {
  octaves: number;
  lacunarity: number;
  persistence: number;
  frequency: number;
  amplitude: number;
}

export function fbm(noise: NoiseSource, x: number, y: number, params: FbmParams): number {
  let value = 0;
  let amplitude = params.amplitude;
  let frequency = params.frequency;
  let maxAmplitude = 0;

  for (let i = 0; i < params.octaves; i++) {
    value += amplitude * noise.noise2D(x * frequency, y * frequency);
    maxAmplitude += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxAmplitude;
}

export function ridged(noise: NoiseSource, x: number, y: number, params: FbmParams): number {
  let value = 0;
  let amplitude = params.amplitude;
  let frequency = params.frequency;
  let maxAmplitude = 0;
  let weight = 1;

  for (let i = 0; i < params.octaves; i++) {
    let signal = noise.noise2D(x * frequency, y * frequency);
    signal = 1.0 - Math.abs(signal);
    signal *= signal;
    signal *= weight;
    weight = Math.min(1, Math.max(0, signal * 2));
    value += amplitude * signal;
    maxAmplitude += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxAmplitude;
}
