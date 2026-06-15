import * as THREE from 'three';
import type { NoiseParams, TerrainParams, ChunkMeshData } from '../types/terrain';
import { getLodLevel } from '../terrain/lod';

export class TerrainMeshManager {
  private scene: THREE.Scene;
  private worker: Worker;
  private noiseParams: NoiseParams;
  private terrainParams: TerrainParams;
  private chunks: Map<string, THREE.Mesh> = new Map();
  private heightmapCache: Map<string, Float32Array> = new Map();
  private pendingRequests: Set<string> = new Set();
  private lodDistances: [number, number, number];
  private chunkLodLevels: Map<string, number> = new Map();

  constructor(
    scene: THREE.Scene,
    worker: Worker,
    noiseParams: NoiseParams,
    terrainParams: TerrainParams,
  ) {
    this.scene = scene;
    this.worker = worker;
    this.noiseParams = noiseParams;
    this.terrainParams = terrainParams;
    this.lodDistances = terrainParams.lodDistances;
  }

  handleWorkerMessage(result: any): void {
    if (result.type === 'MESH_READY') {
      this.onMeshReady(result.meshData);
    } else if (result.type === 'HEIGHTMAP_READY') {
      this.heightmapCache.set('full', result.data);
    }
  }

  update(camera: THREE.Camera): void {
    const camPos = camera.position;
    const worldSize = this.terrainParams.worldSize;
    const chunkSize = this.terrainParams.chunkSize;
    const viewDistance = this.lodDistances[2];

    const startChunkX = Math.floor((camPos.x - viewDistance) / chunkSize);
    const endChunkX = Math.floor((camPos.x + viewDistance) / chunkSize);
    const startChunkZ = Math.floor((camPos.z - viewDistance) / chunkSize);
    const endChunkZ = Math.floor((camPos.z + viewDistance) / chunkSize);

    const visibleChunks = new Set<string>();

    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      for (let cz = startChunkZ; cz <= endChunkZ; cz++) {
        if (cx < 0 || cz < 0) continue;
        if ((cx + 1) * chunkSize > worldSize) continue;
        if ((cz + 1) * chunkSize > worldSize) continue;

        const key = `${cx},${cz}`;
        visibleChunks.add(key);

        const chunkCenterX = (cx + 0.5) * chunkSize;
        const chunkCenterZ = (cz + 0.5) * chunkSize;
        const dx = camPos.x - chunkCenterX;
        const dz = camPos.z - chunkCenterZ;
        const distance = Math.sqrt(dx * dx + dz * dz);

        const lodLevel = getLodLevel(distance, this.lodDistances);
        const currentLod = this.chunkLodLevels.get(key);

        if (currentLod === undefined || currentLod !== lodLevel) {
          this.requestChunk(cx, cz, lodLevel);
        }
      }
    }

    for (const [key, mesh] of this.chunks) {
      if (!visibleChunks.has(key)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.chunks.delete(key);
        this.chunkLodLevels.delete(key);
      }
    }
  }

  requestChunk(chunkX: number, chunkZ: number, lodLevel: number): void {
    const key = `${chunkX},${chunkZ}`;
    if (this.pendingRequests.has(key)) return;

    this.worker.postMessage({
      type: 'GENERATE_MESH',
      chunkId: { x: chunkX, z: chunkZ },
      lodLevel,
      noiseParams: this.noiseParams,
      terrainParams: this.terrainParams,
    });

    this.pendingRequests.add(key);
  }

  onMeshReady(data: ChunkMeshData): void {
    const key = `${data.id.x},${data.id.z}`;
    this.pendingRequests.delete(key);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));

    const material = new THREE.MeshStandardMaterial({ vertexColors: true });

    const existingMesh = this.chunks.get(key);
    if (existingMesh) {
      existingMesh.geometry.dispose();
      (existingMesh.material as THREE.Material).dispose();
      this.scene.remove(existingMesh);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.chunks.set(key, mesh);
    this.chunkLodLevels.set(key, data.lodLevel);
  }

  updateParams(noiseParams: NoiseParams, terrainParams: TerrainParams): void {
    this.noiseParams = noiseParams;
    this.terrainParams = terrainParams;
    this.lodDistances = terrainParams.lodDistances;

    for (const [, mesh] of this.chunks) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.chunks.clear();
    this.chunkLodLevels.clear();
    this.pendingRequests.clear();
    this.heightmapCache.clear();
  }

  getHeightmap(): Float32Array | null {
    return this.heightmapCache.get('full') ?? null;
  }

  getChunks(): Map<string, THREE.Mesh> {
    return this.chunks;
  }

  getChunkLodLevels(): Map<string, number> {
    return this.chunkLodLevels;
  }

  getChunkSize(): number {
    return this.terrainParams.chunkSize;
  }

  getTriangleCount(): number {
    let count = 0;
    for (const mesh of this.chunks.values()) {
      count += mesh.geometry.index ? mesh.geometry.index.count / 3 : 0;
    }
    return Math.floor(count);
  }

  combineChunkGeometry(): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } | null {
    const chunks = Array.from(this.chunks.entries());
    if (chunks.length === 0) return null;

    let totalVertices = 0;
    let totalIndices = 0;
    const chunkData: Array<{ pos: Float32Array; norm: Float32Array; idx: Uint32Array }> = [];

    for (const [, mesh] of chunks) {
      const pos = mesh.geometry.getAttribute('position').array as Float32Array;
      const norm = mesh.geometry.getAttribute('normal').array as Float32Array;
      const idx = mesh.geometry.index ? mesh.geometry.index.array as Uint32Array : new Uint32Array(0);
      
      chunkData.push({ pos, norm, idx });
      totalVertices += pos.length / 3;
      totalIndices += idx.length;
    }

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;

    for (const data of chunkData) {
      const vertexCount = data.pos.length / 3;
      positions.set(data.pos, vertexOffset * 3);
      normals.set(data.norm, vertexOffset * 3);
      
      for (let i = 0; i < data.idx.length; i++) {
        indices[indexOffset + i] = data.idx[i] + vertexOffset;
      }
      
      vertexOffset += vertexCount;
      indexOffset += data.idx.length;
    }

    return { positions, normals, indices };
  }

  dispose(): void {
    for (const [, mesh] of this.chunks) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.chunks.clear();
    this.chunkLodLevels.clear();
    this.pendingRequests.clear();
    this.heightmapCache.clear();
  }
}
