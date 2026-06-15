import * as THREE from 'three';

const waterVertexShader = `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveSpeed;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave1 = sin(pos.x * 0.1 + uTime * uWaveSpeed) * uWaveAmplitude;
    float wave2 = sin(pos.z * 0.15 + uTime * uWaveSpeed * 0.8) * uWaveAmplitude * 0.6;
    float wave3 = sin((pos.x + pos.z) * 0.08 + uTime * uWaveSpeed * 1.2) * uWaveAmplitude * 0.4;
    float wave4 = sin((pos.x - pos.z) * 0.12 + uTime * uWaveSpeed * 0.5) * uWaveAmplitude * 0.3;
    
    float totalWave = wave1 + wave2 + wave3 + wave4;
    pos.y += totalWave;
    
    float dx = cos(pos.x * 0.1 + uTime * uWaveSpeed) * uWaveAmplitude * 0.1
             + cos((pos.x + pos.z) * 0.08 + uTime * uWaveSpeed * 1.2) * uWaveAmplitude * 0.4 * 0.08
             + cos((pos.x - pos.z) * 0.12 + uTime * uWaveSpeed * 0.5) * uWaveAmplitude * 0.3 * 0.12;
    
    float dz = cos(pos.z * 0.15 + uTime * uWaveSpeed * 0.8) * uWaveAmplitude * 0.6 * 0.15
             + cos((pos.x + pos.z) * 0.08 + uTime * uWaveSpeed * 1.2) * uWaveAmplitude * 0.4 * 0.08
             - cos((pos.x - pos.z) * 0.12 + uTime * uWaveSpeed * 0.5) * uWaveAmplitude * 0.3 * 0.12;
    
    vec3 normal = normalize(vec3(-dx, 1.0, -dz));
    vNormal = normalMatrix * normal;
    
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    
    vec4 viewPosition = viewMatrix * worldPosition;
    vViewDir = normalize(cameraPosition - worldPosition.xyz);
    
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const waterFragmentShader = `
  uniform vec3 uWaterColor;
  uniform vec3 uDeepColor;
  uniform float uAlpha;
  uniform float uFresnelPower;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
    
    vec3 skyColor = vec3(0.6, 0.8, 1.0);
    vec3 waterColor = mix(uDeepColor, uWaterColor, 0.6);
    
    vec3 finalColor = mix(waterColor, skyColor, fresnel * 0.8);
    
    float caustic1 = sin(vUv.x * 80.0 + vUv.y * 30.0) * 0.5 + 0.5;
    float caustic2 = sin(vUv.x * 50.0 - vUv.y * 70.0) * 0.5 + 0.5;
    float caustic = caustic1 * caustic2 * 0.1;
    finalColor += caustic;
    
    float alpha = uAlpha + fresnel * 0.3;
    alpha = clamp(alpha, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export class WaterMesh {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private waterLevel: number;
  private worldSize: number;
  private heightScale: number;
  private animationId: number | null = null;
  private startTime: number = 0;

  constructor(scene: THREE.Scene, waterLevel: number, worldSize: number, heightScale: number) {
    this.scene = scene;
    this.waterLevel = waterLevel;
    this.worldSize = worldSize;
    this.heightScale = heightScale;
    this.createMesh();
    this.startAnimation();
  }

  private createMesh(): void {
    const geometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 128, 128);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveAmplitude: { value: 0.3 },
        uWaveSpeed: { value: 0.8 },
        uWaterColor: { value: new THREE.Color(0x4488cc) },
        uDeepColor: { value: new THREE.Color(0x0a2540) },
        uAlpha: { value: 0.6 },
        uFresnelPower: { value: 3.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = this.waterLevel * this.heightScale;
    this.scene.add(this.mesh);
  }

  private startAnimation(): void {
    this.startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - this.startTime) / 1000;
      if (this.material) {
        this.material.uniforms.uTime.value = elapsed;
      }
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  updateParams(waterLevel: number, heightScale: number): void {
    this.waterLevel = waterLevel;
    this.heightScale = heightScale;
    if (this.mesh) {
      this.mesh.position.y = waterLevel * heightScale;
    }
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.material) {
        this.material.dispose();
      }
      this.mesh = null;
      this.material = null;
    }
  }
}
