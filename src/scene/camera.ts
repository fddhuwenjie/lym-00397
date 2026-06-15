import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createCamera(container: HTMLElement): {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
} {
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);

  camera.position.set(256, 200, 256);
  camera.lookAt(256, 0, 256);

  const controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 800;
  controls.target.set(256, 0, 256);

  return { camera, controls };
}
