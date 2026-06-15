export function getLodLevel(
  distance: number,
  lodDistances: [number, number, number],
): number {
  if (distance < lodDistances[0]) return 0;
  if (distance < lodDistances[1]) return 1;
  if (distance < lodDistances[2]) return 2;
  return 3;
}

export function generateLodHeightmap(
  fullHeightmap: Float32Array,
  fullWidth: number,
  fullHeight: number,
  lodLevel: number,
): Float32Array {
  const step = 1 << lodLevel;
  const resultWidth = Math.floor((fullWidth - 1) / step) + 1;
  const resultHeight = Math.floor((fullHeight - 1) / step) + 1;
  const result = new Float32Array(resultWidth * resultHeight);

  for (let z = 0; z < resultHeight; z++) {
    for (let x = 0; x < resultWidth; x++) {
      const srcX = x * step;
      const srcZ = z * step;
      result[z * resultWidth + x] = fullHeightmap[srcZ * fullWidth + srcX];
    }
  }

  return result;
}

export function stitchChunkMesh(
  positions: Float32Array,
  normals: Float32Array,
  width: number,
  height: number,
  neighborLodLevels: { north?: number; south?: number; east?: number; west?: number },
  chunkSize: number,
): { positions: Float32Array; normals: Float32Array } {
  const newPositions = new Float32Array(positions);
  const newNormals = new Float32Array(normals);
  const cellSize = chunkSize / (width - 1);

  const snapEdge = (
    edgeAxis: 'x' | 'z',
    edgeIndex: number,
    neighborLod: number,
  ) => {
    const neighborStep = 1 << neighborLod;
    const neighborCellSize = cellSize * neighborStep;

    for (let i = 0; i < (edgeAxis === 'x' ? height : width); i++) {
      const coord = i * cellSize;
      const snappedCoord = Math.round(coord / neighborCellSize) * neighborCellSize;
      const vertexIndex =
        edgeAxis === 'x'
          ? edgeIndex + i * width
          : i * width + edgeIndex;

      if (edgeAxis === 'x') {
        newPositions[vertexIndex * 3] = snappedCoord;
      } else {
        newPositions[vertexIndex * 3 + 2] = snappedCoord;
      }

      const xL = Math.max(0, (edgeAxis === 'x' ? edgeIndex : i) - 1);
      const xR = Math.min(width - 1, (edgeAxis === 'x' ? edgeIndex : i) + 1);
      const zD = Math.max(0, (edgeAxis === 'z' ? edgeIndex : i) - 1);
      const zU = Math.min(height - 1, (edgeAxis === 'z' ? edgeIndex : i) + 1);

      const hL = newPositions[(zD * width + (edgeAxis === 'x' ? edgeIndex : i)) * 3 + 1];
      const hR = newPositions[(zU * width + (edgeAxis === 'x' ? edgeIndex : i)) * 3 + 1];

      const nx = newNormals[vertexIndex * 3];
      const ny = newNormals[vertexIndex * 3 + 1];
      const nz = newNormals[vertexIndex * 3 + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        newNormals[vertexIndex * 3] = nx / len;
        newNormals[vertexIndex * 3 + 1] = ny / len;
        newNormals[vertexIndex * 3 + 2] = nz / len;
      }
    }
  };

  if (neighborLodLevels.north !== undefined && neighborLodLevels.north > 0) {
    snapEdge('z', 0, neighborLodLevels.north);
  }
  if (neighborLodLevels.south !== undefined && neighborLodLevels.south > 0) {
    snapEdge('z', width - 1, neighborLodLevels.south);
  }
  if (neighborLodLevels.west !== undefined && neighborLodLevels.west > 0) {
    snapEdge('x', 0, neighborLodLevels.west);
  }
  if (neighborLodLevels.east !== undefined && neighborLodLevels.east > 0) {
    snapEdge('x', width - 1, neighborLodLevels.east);
  }

  return { positions: newPositions, normals: newNormals };
}
