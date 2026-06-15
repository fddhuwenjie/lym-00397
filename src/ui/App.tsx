import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTerrainStore } from '../store/terrain-store';
import { createRenderer } from '../scene/renderer';
import { createCamera } from '../scene/camera';
import { createLighting } from '../scene/lighting';
import { TerrainMeshManager } from '../scene/terrain-mesh';
import { WaterMesh } from '../scene/water-mesh';
import { createTerrainWorker } from '../workers/worker-wrapper';
import { exportHeightmapPNG, downloadBlob } from '../export/png-exporter';
import { downloadOBJ } from '../export/obj-exporter';
import { HUD } from './HUD';
import { ControlPanel } from './ControlPanel';
import { ExportPanel } from './ExportPanel';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainManagerRef = useRef<TerrainMeshManager | null>(null);
  const waterMeshRef = useRef<WaterMesh | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const chunkBordersRef = useRef<Map<string, THREE.LineSegments>>(new Map());
  const originalMaterialsRef = useRef<Map<string, THREE.Material>>(new Map());
  const isExportingRef = useRef(false);
  const showLodDebugRef = useRef(false);
  const showChunkBordersRef = useRef(false);
  const noiseParamsRef = useRef(useTerrainStore.getState().noiseParams);
  const terrainParamsRef = useRef(useTerrainStore.getState().terrainParams);
  const erosionParamsRef = useRef(useTerrainStore.getState().erosionParams);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const {
    noiseParams,
    terrainParams,
    erosionParams,
    showLodDebug,
    showChunkBorders,
    setIsGenerating,
    setIsEroding,
    setProgress,
    setFps,
    setTriangleCount,
    setChunkCount,
  } = useTerrainStore();

  isExportingRef.current = isExporting;
  showLodDebugRef.current = showLodDebug;
  showChunkBordersRef.current = showChunkBorders;
  noiseParamsRef.current = noiseParams;
  terrainParamsRef.current = terrainParams;
  erosionParamsRef.current = erosionParams;

  useEffect(() => {
    if (waterMeshRef.current) {
      waterMeshRef.current.updateParams(terrainParams.waterLevel, terrainParams.heightScale);
    }
  }, [terrainParams.waterLevel, terrainParams.heightScale]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);
    scene.fog = new THREE.Fog(0x0a0f1a, 300, 800);
    sceneRef.current = scene;

    const renderer = createRenderer(canvasRef.current);
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;

    const { camera, controls } = createCamera(container);
    cameraRef.current = camera;
    controlsRef.current = controls;

    createLighting(scene);

    const worker = createTerrainWorker();
    workerRef.current = worker;

    const terrainManager = new TerrainMeshManager(scene, worker, noiseParamsRef.current, terrainParamsRef.current);
    terrainManagerRef.current = terrainManager;

    const waterMesh = new WaterMesh(
      scene,
      terrainParamsRef.current.waterLevel,
      terrainParamsRef.current.worldSize,
      terrainParamsRef.current.heightScale,
    );
    waterMeshRef.current = waterMesh;

    const chunkBorders = chunkBordersRef.current;
    const originalMaterials = originalMaterialsRef.current;

    const updateLodDebug = () => {
      if (!terrainManagerRef.current || !showLodDebugRef.current) {
        if (originalMaterials.size > 0 && terrainManagerRef.current) {
          const chunks = terrainManagerRef.current.getChunks();
          for (const [key, mesh] of chunks) {
            const originalMaterial = originalMaterials.get(key);
            if (originalMaterial) {
              mesh.material = originalMaterial;
            }
          }
          originalMaterials.clear();
        }
        return;
      }

      const chunks = terrainManagerRef.current.getChunks();
      const lodLevels = terrainManagerRef.current.getChunkLodLevels();
      const colors = [0x00ff00, 0xffff00, 0xff6600, 0xff0000];

      for (const [key, mesh] of chunks) {
        if (!originalMaterials.has(key)) {
          originalMaterials.set(key, mesh.material as THREE.Material);
        }
        const lodLevel = lodLevels.get(key) ?? 0;
        const color = colors[Math.min(lodLevel, colors.length - 1)];
        
        if (!(mesh.material as THREE.MeshStandardMaterial).emissive || 
            (mesh.material as THREE.MeshStandardMaterial).emissive.getHex() !== color) {
          const debugMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.3,
          });
          mesh.material = debugMaterial;
        }
      }

      for (const key of originalMaterials.keys()) {
        if (!chunks.has(key)) {
          const mat = originalMaterials.get(key);
          if (mat) mat.dispose();
          originalMaterials.delete(key);
        }
      }
    };

    const updateChunkBorders = () => {
      if (!terrainManagerRef.current || !sceneRef.current || !showChunkBordersRef.current) {
        for (const [, border] of chunkBorders) {
          if (sceneRef.current) sceneRef.current.remove(border);
          border.geometry.dispose();
          (border.material as THREE.Material).dispose();
        }
        chunkBorders.clear();
        return;
      }

      const chunks = terrainManagerRef.current.getChunks();
      const chunkSize = terrainManagerRef.current.getChunkSize();

      for (const [key, mesh] of chunks) {
        if (!chunkBorders.has(key)) {
          const [cx, cz] = key.split(',').map(Number);
          const geometry = new THREE.EdgesGeometry(mesh.geometry);
          const material = new THREE.LineBasicMaterial({ 
            color: 0x00e5ff, 
            transparent: true, 
            opacity: 0.8 
          });
          const border = new THREE.LineSegments(geometry, material);
          border.position.set(cx * chunkSize, 0.5, cz * chunkSize);
          sceneRef.current.add(border);
          chunkBorders.set(key, border);
        }
      }

      for (const [key, border] of chunkBorders) {
        if (!chunks.has(key)) {
          sceneRef.current.remove(border);
          border.geometry.dispose();
          (border.material as THREE.Material).dispose();
          chunkBorders.delete(key);
        }
      }
    };

    worker.onmessage = (event: MessageEvent) => {
      const result = event.data;
      if (terrainManagerRef.current) {
        terrainManagerRef.current.handleWorkerMessage(result);
      }
      if (result.type === 'PROGRESS') {
        if (isExportingRef.current) {
          setExportProgress(result.percent);
        } else if (useTerrainStore.getState().isEroding) {
          setProgress(result.percent);
        } else {
          setProgress(result.percent);
          if (result.percent === 100) {
            setIsGenerating(false);
            setProgress(0);
          }
        }
      } else if (result.type === 'HEIGHTMAP_READY' && isExportingRef.current) {
        const blob = exportHeightmapPNG(result.data, result.width, result.height);
        downloadBlob(blob, `terrain_heightmap_${result.width}x${result.height}.png`);
        setIsExporting(false);
        setExportProgress(0);
      } else if (result.type === 'EROSION_READY') {
        if (terrainManagerRef.current) {
          let min = Infinity;
          let max = -Infinity;
          for (let i = 0; i < result.data.length; i++) {
            if (result.data[i] < min) min = result.data[i];
            if (result.data[i] > max) max = result.data[i];
          }
          terrainManagerRef.current.setHeightmap(result.data, min, max);
        }
        setIsEroding(false);
        setProgress(0);
      }
    };

    worker.postMessage({
      type: 'GENERATE_HEIGHTMAP',
      noiseParams: noiseParamsRef.current,
      terrainParams: terrainParamsRef.current,
    });
    setIsGenerating(true);

    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      frameCount++;

      if (now - lastFpsUpdate >= 1000) {
        const fps = (frameCount * 1000) / (now - lastFpsUpdate);
        setFps(fps);
        frameCount = 0;
        lastFpsUpdate = now;

        if (terrainManagerRef.current) {
          setTriangleCount(terrainManagerRef.current.getTriangleCount());
          setChunkCount(terrainManagerRef.current.getChunks().size);
        }
      }

      if (terrainManagerRef.current && cameraRef.current) {
        terrainManagerRef.current.update(cameraRef.current);
      }

      updateLodDebug();
      updateChunkBorders();

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);

      for (const [, border] of chunkBorders) {
        scene.remove(border);
        border.geometry.dispose();
        (border.material as THREE.Material).dispose();
      }
      chunkBorders.clear();
      originalMaterials.clear();

      if (terrainManagerRef.current) {
        terrainManagerRef.current.dispose();
      }
      if (waterMeshRef.current) {
        waterMeshRef.current.dispose();
      }
      worker.terminate();
      renderer.dispose();
    };
  }, []);

  const handleRegenerate = () => {
    if (!terrainManagerRef.current || !workerRef.current) return;
    
    terrainManagerRef.current.updateParams(noiseParamsRef.current, terrainParamsRef.current);
    workerRef.current.postMessage({
      type: 'GENERATE_HEIGHTMAP',
      noiseParams: noiseParamsRef.current,
      terrainParams: terrainParamsRef.current,
    });
    setIsGenerating(true);
  };

  const handleRunErosion = () => {
    if (!terrainManagerRef.current || !workerRef.current) return;
    const heightmap = terrainManagerRef.current.getHeightmap();
    if (!heightmap) return;

    const worldSize = terrainParamsRef.current.worldSize;
    const heightmapCopy = new Float32Array(heightmap);

    workerRef.current.postMessage(
      {
        type: 'RUN_EROSION',
        heightmap: heightmapCopy,
        width: worldSize,
        height: worldSize,
        erosionParams: erosionParamsRef.current,
      },
      [heightmapCopy.buffer] as Transferable[],
    );
    setIsEroding(true);
  };

  const handleExportPNG = (width: number, height: number) => {
    if (!workerRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    workerRef.current.postMessage({
      type: 'EXPORT_HEIGHTMAP',
      noiseParams: noiseParamsRef.current,
      terrainParams: terrainParamsRef.current,
      width,
      height,
    });
  };

  const handleExportOBJ = () => {
    if (!terrainManagerRef.current) return;
    const geometry = terrainManagerRef.current.combineChunkGeometry();
    if (geometry) {
      downloadOBJ(geometry.positions, geometry.normals, geometry.indices, 'terrain.obj');
    }
  };

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <HUD />
      <ControlPanel onRegenerate={handleRegenerate} onRunErosion={handleRunErosion} />
      <ExportPanel
        onExportPNG={handleExportPNG}
        onExportOBJ={handleExportOBJ}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />
    </div>
  );
}
