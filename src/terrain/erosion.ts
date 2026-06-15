export interface ErosionParams {
  droplets: number;
  erosionRate: number;
  depositionRate: number;
  lifetime: number;
  inertia?: number;
  capacity?: number;
  minSlope?: number;
  gravity?: number;
  evaporationRate?: number;
  radius?: number;
}

const defaultParams: Required<ErosionParams> = {
  droplets: 50000,
  erosionRate: 0.3,
  depositionRate: 0.3,
  lifetime: 60,
  inertia: 0.05,
  capacity: 4,
  minSlope: 0.01,
  gravity: 4,
  evaporationRate: 0.02,
  radius: 3,
};

function getGradient(heightmap: Float32Array, width: number, height: number, x: number, y: number): { h: number; dx: number; dy: number } {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const u = x - x0;
  const v = y - y0;

  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const h00 = heightmap[y0 * width + x0];
  const h10 = heightmap[y0 * width + x1];
  const h01 = heightmap[y1 * width + x0];
  const h11 = heightmap[y1 * width + x1];

  const h = h00 * (1 - u) * (1 - v) + h10 * u * (1 - v) + h01 * (1 - u) * v + h11 * u * v;

  const dx = (h10 - h00) * (1 - v) + (h11 - h01) * v;
  const dy = (h01 - h00) * (1 - u) + (h11 - h10) * u;

  return { h, dx, dy };
}

function deposit(heightmap: Float32Array, width: number, height: number, x: number, y: number, amount: number, radius: number): void {
  const x0 = Math.max(0, Math.floor(x - radius));
  const y0 = Math.max(0, Math.floor(y - radius));
  const x1 = Math.min(width - 1, Math.ceil(x + radius));
  const y1 = Math.min(height - 1, Math.ceil(y + radius));

  let totalWeight = 0;
  const weights: number[] = [];
  const indices: number[] = [];

  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      const dx = ix - x;
      const dy = iy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const w = 1 - dist / radius;
        totalWeight += w;
        weights.push(w);
        indices.push(iy * width + ix);
      }
    }
  }

  if (totalWeight > 0) {
    for (let i = 0; i < indices.length; i++) {
      heightmap[indices[i]] += amount * weights[i] / totalWeight;
    }
  }
}

function erode(heightmap: Float32Array, width: number, height: number, x: number, y: number, amount: number, radius: number): void {
  const x0 = Math.max(0, Math.floor(x - radius));
  const y0 = Math.max(0, Math.floor(y - radius));
  const x1 = Math.min(width - 1, Math.ceil(x + radius));
  const y1 = Math.min(height - 1, Math.ceil(y + radius));

  let totalWeight = 0;
  const weights: number[] = [];
  const indices: number[] = [];

  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      const dx = ix - x;
      const dy = iy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const w = 1 - dist / radius;
        totalWeight += w;
        weights.push(w);
        indices.push(iy * width + ix);
      }
    }
  }

  if (totalWeight > 0) {
    for (let i = 0; i < indices.length; i++) {
      heightmap[indices[i]] -= amount * weights[i] / totalWeight;
    }
  }
}

export function hydraulicErosion(
  heightmap: Float32Array,
  width: number,
  height: number,
  params: ErosionParams,
  onProgress?: (percent: number) => void,
): Float32Array {
  const p: Required<ErosionParams> = { ...defaultParams, ...params };
  const result = new Float32Array(heightmap);

  const progressInterval = Math.max(1, Math.floor(p.droplets / 100));

  for (let i = 0; i < p.droplets; i++) {
    let posX = Math.random() * (width - 2) + 1;
    let posY = Math.random() * (height - 2) + 1;
    let dirX = 0;
    let dirY = 0;
    let speed = 1;
    let water = 1;
    let sediment = 0;

    for (let life = 0; life < p.lifetime; life++) {
      const ix = Math.floor(posX);
      const iy = Math.floor(posY);

      if (ix < 0 || ix >= width - 1 || iy < 0 || iy >= height - 1) break;

      const { h, dx, dy } = getGradient(result, width, height, posX, posY);

      dirX = dirX * p.inertia - dx * (1 - p.inertia);
      dirY = dirY * p.inertia - dy * (1 - p.inertia);

      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0) {
        dirX /= len;
        dirY /= len;
      } else {
        const angle = Math.random() * Math.PI * 2;
        dirX = Math.cos(angle);
        dirY = Math.sin(angle);
      }

      const newPosX = posX + dirX;
      const newPosY = posY + dirY;

      if (newPosX < 0 || newPosX >= width - 1 || newPosY < 0 || newPosY >= height - 1) break;

      const { h: newH } = getGradient(result, width, height, newPosX, newPosY);
      const deltaH = newH - h;

      const capacity = Math.max(-deltaH, p.minSlope) * speed * water * p.capacity;

      if (sediment > capacity || deltaH > 0) {
        const depositAmount = deltaH > 0
          ? Math.min(deltaH, sediment)
          : (sediment - capacity) * p.depositionRate;
        sediment -= depositAmount;
        deposit(result, width, height, posX, posY, depositAmount, p.radius);
      } else {
        const erodeAmount = Math.min((capacity - sediment) * p.erosionRate, -deltaH);
        sediment += erodeAmount;
        erode(result, width, height, posX, posY, erodeAmount, p.radius);
      }

      speed = Math.sqrt(Math.max(0, speed * speed + deltaH * p.gravity));
      water *= (1 - p.evaporationRate);

      posX = newPosX;
      posY = newPosY;

      if (water < 0.01) break;
    }

    if (onProgress && (i + 1) % progressInterval === 0) {
      onProgress(Math.min(100, Math.round(((i + 1) / p.droplets) * 100)));
    }
  }

  if (onProgress) onProgress(100);

  return result;
}
