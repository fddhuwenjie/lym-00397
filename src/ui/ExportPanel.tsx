import { useState } from 'react';
import { Download, Image, Box } from 'lucide-react';

interface ExportPanelProps {
  onExportPNG?: (width: number, height: number) => void;
  onExportOBJ?: () => void;
  isExporting?: boolean;
  exportProgress?: number;
}

export function ExportPanel({ onExportPNG, onExportOBJ, isExporting = false, exportProgress = 0 }: ExportPanelProps) {
  const [pngWidth, setPngWidth] = useState(2048);
  const [pngHeight, setPngHeight] = useState(2048);

  const handleExportPNG = () => {
    if (onExportPNG && !isExporting) {
      onExportPNG(pngWidth, pngHeight);
    }
  };

  const handleExportOBJ = () => {
    if (onExportOBJ && !isExporting) {
      onExportOBJ();
    }
  };

  return (
    <div className="fixed right-4 z-50 w-80" style={{ top: 'calc(100vh - 280px)' }}>
      <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10">
        <div className="p-4 border-b border-cyan-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            EXPORT
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              HEIGHTMAP EXPORT
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-cyan-300 mb-1 font-medium">WIDTH</label>
                  <input
                    type="number"
                    value={pngWidth}
                    onChange={(e) => setPngWidth(Math.max(64, Math.min(8192, parseInt(e.target.value) || 2048)))}
                    className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                    min="64"
                    max="8192"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-300 mb-1 font-medium">HEIGHT</label>
                  <input
                    type="number"
                    value={pngHeight}
                    onChange={(e) => setPngHeight(Math.max(64, Math.min(8192, parseInt(e.target.value) || 2048)))}
                    className="w-full bg-slate-800/80 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                    min="64"
                    max="8192"
                  />
                </div>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-orange-600/30 hover:shadow-orange-500/50 flex items-center justify-center gap-2"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? 'EXPORTING...' : 'EXPORT PNG'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4" />
              MESH EXPORT
            </h3>
            <button
              onClick={handleExportOBJ}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-orange-600/30 hover:shadow-orange-500/50 flex items-center justify-center gap-2"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'EXPORTING...' : 'EXPORT OBJ'}
            </button>
          </div>

          {isExporting && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-cyan-400 font-medium">EXPORT PROGRESS</span>
                <span className="text-xs text-cyan-300 font-mono">{exportProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
