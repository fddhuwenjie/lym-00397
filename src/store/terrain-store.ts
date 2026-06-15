import { create } from 'zustand';
import type { NoiseParams, TerrainParams } from '../types/terrain';

interface TerrainState {
  noiseParams: NoiseParams;
  terrainParams: TerrainParams;
  isGenerating: boolean;
  progress: number;
  showLodDebug: boolean;
  showChunkBorders: boolean;
  fps: number;
  triangleCount: number;
  chunkCount: number;

  setNoiseParams: (params: Partial<NoiseParams>) => void;
  setTerrainParams: (params: Partial<TerrainParams>) => void;
  setIsGenerating: (v: boolean) => void;
  setProgress: (v: number) => void;
  setShowLodDebug: (v: boolean) => void;
  setShowChunkBorders: (v: boolean) => void;
  setFps: (v: number) => void;
  setTriangleCount: (v: number) => void;
  setChunkCount: (v: number) => void;
}

const defaultNoiseParams: NoiseParams = {
  seed: 42,
  amplitude: 1.0,
  frequency: 0.01,
  octaves: 4,
  lacunarity: 2.0,
  persistence: 0.5,
  noiseType: 'perlin',
  fractalType: 'fbm',
};

const defaultTerrainParams: TerrainParams = {
  heightScale: 80,
  waterLevel: 0.3,
  chunkSize: 64,
  worldSize: 512,
  lodDistances: [80, 160, 320],
};

export const useTerrainStore = create<TerrainState>((set) => ({
  noiseParams: { ...defaultNoiseParams },
  terrainParams: { ...defaultTerrainParams },
  isGenerating: false,
  progress: 0,
  showLodDebug: false,
  showChunkBorders: false,
  fps: 0,
  triangleCount: 0,
  chunkCount: 0,

  setNoiseParams: (params) =>
    set((state) => ({ noiseParams: { ...state.noiseParams, ...params } })),
  setTerrainParams: (params) =>
    set((state) => ({ terrainParams: { ...state.terrainParams, ...params } })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setProgress: (v) => set({ progress: v }),
  setShowLodDebug: (v) => set({ showLodDebug: v }),
  setShowChunkBorders: (v) => set({ showChunkBorders: v }),
  setFps: (v) => set({ fps: v }),
  setTriangleCount: (v) => set({ triangleCount: v }),
  setChunkCount: (v) => set({ chunkCount: v }),
}));
