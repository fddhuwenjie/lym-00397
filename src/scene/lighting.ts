import * as THREE from 'three';

export function createLighting(scene: THREE.Scene): void {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(200, 300, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -300;
  directionalLight.shadow.camera.right = 300;
  directionalLight.shadow.camera.top = 300;
  directionalLight.shadow.camera.bottom = -300;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 800;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x6688cc, 0.4);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0x88bbff, 0x445522, 0.3);
  scene.add(hemisphereLight);
}
