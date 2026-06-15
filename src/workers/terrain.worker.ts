import { generateHeightmap } from '../terrain/heightmap';
import { generateMesh } from '../terrain/mesh';
import { generateColors } from '../terrain/coloring';
import type {
  WorkerMessage,
  WorkerGenerateHeightmap,
  WorkerGenerateMesh,
  WorkerExportHeightmap,
  ChunkMeshData,
} from '../types/terrain';

declare const self: Worker & { postMessage: (message: any, transfer?: Transferable[]) => void };

function postProgress(percent: number) {
  self.postMessage({ type: 'PROGRESS', percent });
}

function handleGenerateHeightmap(msg: WorkerGenerateHeightmap) {
  const { noiseParams, terrainParams } = msg;
  const size = terrainParams.worldSize;
  const data = generateHeightmap(noiseParams, size, size);
  postProgress(100);
  self.postMessage(
    { type: 'HEIGHTMAP_READY', data, width: size, height: size },
    [data.buffer] as Transferable[],
  );
}

function handleGenerateMesh(msg: WorkerGenerateMesh) {
  const { chunkId, lodLevel, noiseParams, terrainParams } = msg;
  const { chunkSize, heightScale, waterLevel, worldSize } = terrainParams;

  const lodScale = Math.pow(2, lodLevel);
  const effectiveChunkSize = Math.max(1, Math.floor(chunkSize / lodScale));
  const offsetX = chunkId.x * chunkSize;
  const offsetZ = chunkId.z * chunkSize;

  postProgress(20);
  const heightmap = generateHeightmap(
    noiseParams,
    effectiveChunkSize + 1,
    effectiveChunkSize + 1,
    offsetX,
    offsetZ,
  );

  postProgress(50);
  const mesh = generateMesh(
    heightmap,
    effectiveChunkSize + 1,
    effectiveChunkSize + 1,
    heightScale,
    chunkSize,
    offsetX,
    offsetZ,
  );

  postProgress(75);
  const vertexCount = (effectiveChunkSize + 1) * (effectiveChunkSize + 1);
  const colors = generateColors(heightmap, mesh.normals, vertexCount, waterLevel);

  const meshData: ChunkMeshData = {
    id: chunkId,
    lodLevel,
    positions: mesh.positions,
    normals: mesh.normals,
    colors,
    indices: mesh.indices,
  };

  postProgress(100);
  self.postMessage(
    { type: 'MESH_READY', meshData },
    [
      meshData.positions.buffer,
      meshData.normals.buffer,
      meshData.colors.buffer,
      meshData.indices.buffer,
    ] as Transferable[],
  );
}

function handleExportHeightmap(msg: WorkerExportHeightmap) {
  const { noiseParams, terrainParams, width, height } = msg;
  const tileSize = 512;
  const needsTiling = width > tileSize || height > tileSize;

  if (!needsTiling) {
    const data = generateHeightmap(noiseParams, width, height);
    postProgress(100);
    self.postMessage(
      { type: 'HEIGHTMAP_READY', data, width, height },
      [data.buffer] as Transferable[],
    );
    return;
  }

  const result = new Float32Array(width * height);
  const tilesX = Math.ceil(width / tileSize);
  const tilesZ = Math.ceil(height / tileSize);
  const totalTiles = tilesX * tilesZ;

  for (let tz = 0; tz < tilesZ; tz++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tileOffsetX = tx * tileSize;
      const tileOffsetZ = tz * tileSize;
      const tileWidth = Math.min(tileSize, width - tileOffsetX);
      const tileHeight = Math.min(tileSize, height - tileOffsetZ);

      const tileData = generateHeightmap(
        noiseParams,
        tileWidth,
        tileHeight,
        tileOffsetX,
        tileOffsetZ,
      );

      for (let z = 0; z < tileHeight; z++) {
        for (let x = 0; x < tileWidth; x++) {
          result[(tileOffsetZ + z) * width + (tileOffsetX + x)] = tileData[z * tileWidth + x];
        }
      }

      const completed = tz * tilesX + tx + 1;
      postProgress(Math.round((completed / totalTiles) * 100));
    }
  }

  self.postMessage(
    { type: 'HEIGHTMAP_READY', data: result, width, height },
    [result.buffer] as Transferable[],
  );
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'GENERATE_HEIGHTMAP':
      handleGenerateHeightmap(msg);
      break;
    case 'GENERATE_MESH':
      handleGenerateMesh(msg);
      break;
    case 'EXPORT_HEIGHTMAP':
      handleExportHeightmap(msg);
      break;
  }
};
