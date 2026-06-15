export function generateMesh(
  heightmap: Float32Array,
  width: number,
  height: number,
  heightScale: number,
  chunkSize: number,
  offsetX: number = 0,
  offsetZ: number = 0,
): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } {
  const cellSize = chunkSize / (width - 1);
  const vertexCount = width * height;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const idx = z * width + x;
      const h = heightmap[idx] * heightScale;
      positions[idx * 3] = x * cellSize + offsetX;
      positions[idx * 3 + 1] = h;
      positions[idx * 3 + 2] = z * cellSize + offsetZ;
    }
  }

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const idx = z * width + x;
      const xL = Math.max(0, x - 1);
      const xR = Math.min(width - 1, x + 1);
      const zD = Math.max(0, z - 1);
      const zU = Math.min(height - 1, z + 1);

      const hL = heightmap[z * width + xL] * heightScale;
      const hR = heightmap[z * width + xR] * heightScale;
      const hD = heightmap[zD * width + x] * heightScale;
      const hU = heightmap[zU * width + x] * heightScale;

      const nx = hL - hR;
      const ny = 2 * cellSize;
      const nz = hD - hU;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals[idx * 3] = nx / len;
      normals[idx * 3 + 1] = ny / len;
      normals[idx * 3 + 2] = nz / len;
    }
  }

  const indexCount = (width - 1) * (height - 1) * 6;
  const indices = new Uint32Array(indexCount);
  let triIdx = 0;

  for (let z = 0; z < height - 1; z++) {
    for (let x = 0; x < width - 1; x++) {
      const tl = z * width + x;
      const tr = tl + 1;
      const bl = tl + width;
      const br = bl + 1;

      indices[triIdx++] = tl;
      indices[triIdx++] = bl;
      indices[triIdx++] = tr;

      indices[triIdx++] = tr;
      indices[triIdx++] = bl;
      indices[triIdx++] = br;
    }
  }

  return { positions, normals, indices };
}
