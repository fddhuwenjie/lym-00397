export interface NoiseParams {
  seed: number;
  amplitude: number;
  frequency: number;
  octaves: number;
  lacunarity: number;
  persistence: number;
  noiseType: 'perlin' | 'simplex';
  fractalType: 'fbm' | 'ridged';
}

export interface TerrainParams {
  heightScale: number;
  waterLevel: number;
  chunkSize: number;
  worldSize: number;
  lodDistances: [number, number, number];
}

export interface ChunkId {
  x: number;
  z: number;
}

export interface ChunkMeshData {
  id: ChunkId;
  lodLevel: number;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

export type WorkerMessageType = 'GENERATE_HEIGHTMAP' | 'GENERATE_MESH' | 'EXPORT_HEIGHTMAP';

export interface WorkerGenerateHeightmap {
  type: 'GENERATE_HEIGHTMAP';
  noiseParams: NoiseParams;
  terrainParams: TerrainParams;
}

export interface WorkerGenerateMesh {
  type: 'GENERATE_MESH';
  chunkId: ChunkId;
  lodLevel: number;
  noiseParams: NoiseParams;
  terrainParams: TerrainParams;
  globalMin?: number;
  globalMax?: number;
}

export interface WorkerExportHeightmap {
  type: 'EXPORT_HEIGHTMAP';
  noiseParams: NoiseParams;
  terrainParams: TerrainParams;
  width: number;
  height: number;
}

export type WorkerMessage = WorkerGenerateHeightmap | WorkerGenerateMesh | WorkerExportHeightmap;

export interface WorkerHeightmapResult {
  type: 'HEIGHTMAP_READY';
  data: Float32Array;
  width: number;
  height: number;
  min: number;
  max: number;
}

export interface WorkerMeshResult {
  type: 'MESH_READY';
  meshData: ChunkMeshData;
}

export interface WorkerProgressResult {
  type: 'PROGRESS';
  percent: number;
}

export type WorkerResult = WorkerHeightmapResult | WorkerMeshResult | WorkerProgressResult;
