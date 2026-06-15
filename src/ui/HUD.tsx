import { useTerrainStore } from '../store/terrain-store';

export function HUD() {
  const { fps, triangleCount, chunkCount, isGenerating, progress } = useTerrainStore();

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-4 shadow-lg shadow-cyan-500/10">
        <div className="font-mono text-sm space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-medium min-w-24">FPS</span>
            <span className="text-white font-bold">{fps.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-medium min-w-24">TRIANGLES</span>
            <span className="text-white font-bold">{triangleCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-medium min-w-24">CHUNKS</span>
            <span className="text-white font-bold">{chunkCount}</span>
          </div>
          {isGenerating && (
            <div className="mt-3 pt-3 border-t border-cyan-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 font-medium text-xs">GENERATING</span>
                <span className="text-orange-300 font-bold text-xs">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-orange-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
