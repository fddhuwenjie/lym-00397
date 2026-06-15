import { create } from 'zustand';
import type { NoiseParams, TerrainParams, ErosionParams } from '../types/terrain';

interface TerrainState {
  noiseParams: NoiseParams;
  terrainParams: TerrainParams;
  erosionParams: ErosionParams;
  isGenerating: boolean;
  isEroding: boolean;
  progress: number;
  showLodDebug: boolean;
  showChunkBorders: boolean;
  fps: number;
  triangleCount: number;
  chunkCount: number;

  setNoiseParams: (params: Partial<NoiseParams>) => void;
  setTerrainParams: (params: Partial<TerrainParams>) => void;
  setErosionParams: (params: Partial<ErosionParams>) => void;
  setIsGenerating: (v: boolean) => void;
  setIsEroding: (v: boolean) => void;
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

const defaultErosionParams: ErosionParams = {
  droplets: 50000,
  erosionRate: 0.3,
  depositionRate: 0.3,
  lifetime: 60,
};

export const useTerrainStore = create<TerrainState>((set) => ({
  noiseParams: { ...defaultNoiseParams },
  terrainParams: { ...defaultTerrainParams },
  erosionParams: { ...defaultErosionParams },
  isGenerating: false,
  isEroding: false,
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
  setErosionParams: (params) =>
    set((state) => ({ erosionParams: { ...state.erosionParams, ...params } })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsEroding: (v) => set({ isEroding: v }),
  setProgress: (v) => set({ progress: v }),
  setShowLodDebug: (v) => set({ showLodDebug: v }),
  setShowChunkBorders: (v) => set({ showChunkBorders: v }),
  setFps: (v) => set({ fps: v }),
  setTriangleCount: (v) => set({ triangleCount: v }),
  setChunkCount: (v) => set({ chunkCount: v }),
}));
