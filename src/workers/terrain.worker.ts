import { generateHeightmap } from '../terrain/heightmap';
import { generateMesh } from '../terrain/mesh';
import { generateColors } from '../terrain/coloring';
import { hydraulicErosion } from '../terrain/erosion';
import type {
  WorkerMessage,
  WorkerGenerateHeightmap,
  WorkerGenerateMesh,
  WorkerExportHeightmap,
  WorkerRunErosion,
  ChunkMeshData,
} from '../types/terrain';

declare const self: Worker & { postMessage: (message: any, transfer?: Transferable[]) => void };

function postProgress(percent: number) {
  self.postMessage({ type: 'PROGRESS', percent });
}

function handleGenerateHeightmap(msg: WorkerGenerateHeightmap) {
  const { noiseParams, terrainParams } = msg;
  const size = terrainParams.worldSize;
  const { data, min, max } = generateHeightmap(noiseParams, size, size);
  postProgress(100);
  self.postMessage(
    { type: 'HEIGHTMAP_READY', data, width: size, height: size, min, max },
    [data.buffer] as Transferable[],
  );
}

function handleGenerateMesh(msg: WorkerGenerateMesh) {
  const { chunkId, lodLevel, noiseParams, terrainParams, globalMin, globalMax } = msg;
  const { chunkSize, heightScale, waterLevel, worldSize } = terrainParams;

  const lodScale = Math.pow(2, lodLevel);
  const effectiveChunkSize = Math.max(1, Math.floor(chunkSize / lodScale));
  const offsetX = chunkId.x * chunkSize;
  const offsetZ = chunkId.z * chunkSize;

  postProgress(20);
  const { data: heightmap } = generateHeightmap(
    noiseParams,
    effectiveChunkSize + 1,
    effectiveChunkSize + 1,
    offsetX,
    offsetZ,
    globalMin,
    globalMax,
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
    const { data, min, max } = generateHeightmap(noiseParams, width, height);
    postProgress(100);
    self.postMessage(
      { type: 'HEIGHTMAP_READY', data, width, height, min, max },
      [data.buffer] as Transferable[],
    );
    return;
  }

  postProgress(5);
  const { min: globalMin, max: globalMax } = generateHeightmap(noiseParams, width, height);
  postProgress(10);

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

      const { data: tileData } = generateHeightmap(
        noiseParams,
        tileWidth,
        tileHeight,
        tileOffsetX,
        tileOffsetZ,
        globalMin,
        globalMax,
      );

      for (let z = 0; z < tileHeight; z++) {
        for (let x = 0; x < tileWidth; x++) {
          result[(tileOffsetZ + z) * width + (tileOffsetX + x)] = tileData[z * tileWidth + x];
        }
      }

      const completed = tz * tilesX + tx + 1;
      const progress = 10 + Math.round((completed / totalTiles) * 90);
      postProgress(progress);
    }
  }

  self.postMessage(
    { type: 'HEIGHTMAP_READY', data: result, width, height, min: globalMin, max: globalMax },
    [result.buffer] as Transferable[],
  );
}

function handleRunErosion(msg: WorkerRunErosion) {
  const { heightmap, width, height, erosionParams } = msg;
  const result = hydraulicErosion(heightmap, width, height, erosionParams, postProgress);
  self.postMessage(
    { type: 'EROSION_READY', data: result, width, height },
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
    case 'RUN_EROSION':
      handleRunErosion(msg);
      break;
  }
};
