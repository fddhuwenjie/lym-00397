import { useTerrainStore } from '../store/terrain-store';
import { RefreshCw, Sliders, Mountain, Bug } from 'lucide-react';

interface ControlPanelProps {
  onRegenerate?: () => void;
}

export function ControlPanel({ onRegenerate }: ControlPanelProps) {
  const {
    noiseParams,
    terrainParams,
    showLodDebug,
    showChunkBorders,
    isGenerating,
    setNoiseParams,
    setTerrainParams,
    setShowLodDebug,
    setShowChunkBorders,
  } = useTerrainStore();

  const handleRandomizeSeed = () => {
    setNoiseParams({ seed: Math.floor(Math.random() * 1000000) });
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-screen overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10">
        <div className="p-4 border-b border-cyan-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            TERRAIN CONTROLS
          </h2>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              NOISE PARAMETERS
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-cyan-300 mb-1 font-medium">SEED</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={noiseParams.seed}
                    onChange={(e) => setNoiseParams({ seed: parseInt(e.target.value) || 0 })}
                    className="flex-1 bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    onClick={handleRandomizeSeed}
                    className="px-3 py-2 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">AMPLITUDE</label>
                  <span className="text-xs text-white font-mono">{noiseParams.amplitude.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.01"
                    value={noiseParams.amplitude}
                    onChange={(e) => setNoiseParams({ amplitude: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">2.0</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">FREQUENCY</label>
                  <span className="text-xs text-white font-mono">{noiseParams.frequency.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">0.001</span>
                  <input
                    type="range"
                    min="0.001"
                    max="0.05"
                    step="0.001"
                    value={noiseParams.frequency}
                    onChange={(e) => setNoiseParams({ frequency: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">0.05</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">OCTAVES</label>
                  <span className="text-xs text-white font-mono">{noiseParams.octaves}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">1</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={noiseParams.octaves}
                    onChange={(e) => setNoiseParams({ octaves: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">8</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">LACUNARITY</label>
                  <span className="text-xs text-white font-mono">{noiseParams.lacunarity.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">1.0</span>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={noiseParams.lacunarity}
                    onChange={(e) => setNoiseParams({ lacunarity: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">4.0</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">PERSISTENCE</label>
                  <span className="text-xs text-white font-mono">{noiseParams.persistence.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.01"
                    value={noiseParams.persistence}
                    onChange={(e) => setNoiseParams({ persistence: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">0.9</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-cyan-300 mb-1 font-medium">NOISE TYPE</label>
                <select
                  value={noiseParams.noiseType}
                  onChange={(e) => setNoiseParams({ noiseType: e.target.value as 'perlin' | 'simplex' })}
                  className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="perlin">Perlin Noise</option>
                  <option value="simplex">Simplex Noise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-cyan-300 mb-1 font-medium">FRACTAL TYPE</label>
                <select
                  value={noiseParams.fractalType}
                  onChange={(e) => setNoiseParams({ fractalType: e.target.value as 'fbm' | 'ridged' })}
                  className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="fbm">FBM (Fractal Brownian Motion)</option>
                  <option value="ridged">Ridged Multi-fractal</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              TERRAIN PARAMETERS
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">HEIGHT SCALE</label>
                  <span className="text-xs text-white font-mono">{terrainParams.heightScale}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">10</span>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="1"
                    value={terrainParams.heightScale}
                    onChange={(e) => setTerrainParams({ heightScale: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">200</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-cyan-300 font-medium">WATER LEVEL</label>
                  <span className="text-xs text-white font-mono">{terrainParams.waterLevel.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={terrainParams.waterLevel}
                    onChange={(e) => setTerrainParams({ waterLevel: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono">1</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-cyan-300 mb-1 font-medium">CHUNK SIZE</label>
                <select
                  value={terrainParams.chunkSize}
                  onChange={(e) => setTerrainParams({ chunkSize: parseInt(e.target.value) as 32 | 64 | 128 })}
                  className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="32">32 x 32</option>
                  <option value="64">64 x 64</option>
                  <option value="128">128 x 128</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-cyan-300 mb-2 font-medium">LOD DISTANCES</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 text-center">NEAR</label>
                    <input
                      type="number"
                      value={terrainParams.lodDistances[0]}
                      onChange={(e) => setTerrainParams({
                        lodDistances: [parseInt(e.target.value) || 0, terrainParams.lodDistances[1], terrainParams.lodDistances[2]]
                      })}
                      className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-2 py-1.5 text-white text-sm font-mono text-center focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 text-center">MID</label>
                    <input
                      type="number"
                      value={terrainParams.lodDistances[1]}
                      onChange={(e) => setTerrainParams({
                        lodDistances: [terrainParams.lodDistances[0], parseInt(e.target.value) || 0, terrainParams.lodDistances[2]]
                      })}
                      className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-2 py-1.5 text-white text-sm font-mono text-center focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 text-center">FAR</label>
                    <input
                      type="number"
                      value={terrainParams.lodDistances[2]}
                      onChange={(e) => setTerrainParams({
                        lodDistances: [terrainParams.lodDistances[0], terrainParams.lodDistances[1], parseInt(e.target.value) || 0]
                      })}
                      className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-2 py-1.5 text-white text-sm font-mono text-center focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              DEBUG OPTIONS
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLodDebug}
                  onChange={(e) => setShowLodDebug(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-cyan-500/50 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-cyan-300">Show LOD Debug Colors</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChunkBorders}
                  onChange={(e) => setShowChunkBorders(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-cyan-500/50 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-cyan-300">Show Chunk Borders</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-cyan-500/20">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-cyan-600/30 hover:shadow-cyan-500/50 hover:shadow-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'GENERATING...' : 'REGENERATE TERRAIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
