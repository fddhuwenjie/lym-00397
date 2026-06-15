import { describe, it, expect } from 'vitest';
import { getLodLevel, generateLodHeightmap, stitchChunkMesh } from '../src/terrain/lod';

describe('LOD', () => {
  describe('getLodLevel', () => {
    const lodDistances: [number, number, number] = [100, 200, 300];

    it('returns correct level for various distances', () => {
      expect(getLodLevel(0, lodDistances)).toBe(0);
      expect(getLodLevel(50, lodDistances)).toBe(0);
      expect(getLodLevel(99, lodDistances)).toBe(0);
      expect(getLodLevel(100, lodDistances)).toBe(1);
      expect(getLodLevel(150, lodDistances)).toBe(1);
      expect(getLodLevel(199, lodDistances)).toBe(1);
      expect(getLodLevel(200, lodDistances)).toBe(2);
      expect(getLodLevel(250, lodDistances)).toBe(2);
      expect(getLodLevel(299, lodDistances)).toBe(2);
      expect(getLodLevel(300, lodDistances)).toBe(3);
      expect(getLodLevel(500, lodDistances)).toBe(3);
    });
  });

  describe('generateLodHeightmap', () => {
    it('downsampling is correct (step=2 means every other pixel)', () => {
      const fullWidth = 5;
      const fullHeight = 5;
      const fullHeightmap = new Float32Array(fullWidth * fullHeight);
      for (let z = 0; z < fullHeight; z++) {
        for (let x = 0; x < fullWidth; x++) {
          fullHeightmap[z * fullWidth + x] = z * fullWidth + x;
        }
      }

      const lod1 = generateLodHeightmap(fullHeightmap, fullWidth, fullHeight, 1);
      expect(lod1.length).toBe(3 * 3);
      expect(lod1[0]).toBe(0);
      expect(lod1[1]).toBe(2);
      expect(lod1[2]).toBe(4);
      expect(lod1[3]).toBe(10);
      expect(lod1[4]).toBe(12);
      expect(lod1[5]).toBe(14);
      expect(lod1[6]).toBe(20);
      expect(lod1[7]).toBe(22);
      expect(lod1[8]).toBe(24);

      const lod2 = generateLodHeightmap(fullHeightmap, fullWidth, fullHeight, 2);
      expect(lod2.length).toBe(2 * 2);
      expect(lod2[0]).toBe(0);
      expect(lod2[1]).toBe(4);
      expect(lod2[2]).toBe(20);
      expect(lod2[3]).toBe(24);
    });
  });

  describe('stitchChunkMesh', () => {
    it('doesn\'t break vertex count', () => {
      const width = 4;
      const height = 4;
      const vertexCount = width * height;
      const positions = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);

      for (let i = 0; i < vertexCount; i++) {
        const x = i % width;
        const z = Math.floor(i / width);
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;
        normals[i * 3] = 0;
        normals[i * 3 + 1] = 1;
        normals[i * 3 + 2] = 0;
      }

      const result = stitchChunkMesh(
        positions,
        normals,
        width,
        height,
        { north: 1, south: 1, east: 1, west: 1 },
        16
      );

      expect(result.positions.length).toBe(positions.length);
      expect(result.normals.length).toBe(normals.length);
    });
  });
});
