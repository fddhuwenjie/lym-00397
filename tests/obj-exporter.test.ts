import { describe, it, expect } from 'vitest';
import { exportOBJ } from '../src/export/obj-exporter';

describe('OBJ Exporter', () => {
  it('exportOBJ produces valid OBJ format', () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
      1, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const indices = new Uint32Array([
      0, 1, 2,
      1, 3, 2,
    ]);

    const obj = exportOBJ(positions, normals, indices);
    expect(typeof obj).toBe('string');
    expect(obj.length).toBeGreaterThan(0);
  });

  it('Verify header comment exists', () => {
    const positions = new Float32Array([0, 0, 0]);
    const normals = new Float32Array([0, 0, 1]);
    const indices = new Uint32Array([0]);

    const obj = exportOBJ(positions, normals, indices);
    const lines = obj.trim().split('\n');
    expect(lines[0]).toBe('# Terrain Engine OBJ Export');
  });

  it('Verify correct number of v, vn, f lines', () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
      1, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const indices = new Uint32Array([
      0, 1, 2,
      1, 3, 2,
    ]);

    const obj = exportOBJ(positions, normals, indices);
    const lines = obj.trim().split('\n');

    let vCount = 0;
    let vnCount = 0;
    let fCount = 0;

    for (const line of lines) {
      if (line.startsWith('v ')) vCount++;
      if (line.startsWith('vn ')) vnCount++;
      if (line.startsWith('f ')) fCount++;
    }

    expect(vCount).toBe(4);
    expect(vnCount).toBe(4);
    expect(fCount).toBe(2);
  });

  it('Verify indices are 1-indexed', () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const indices = new Uint32Array([0, 1, 2]);

    const obj = exportOBJ(positions, normals, indices);
    const lines = obj.trim().split('\n');
    const fLine = lines.find(l => l.startsWith('f '));
    expect(fLine).toBeDefined();
    expect(fLine).toContain('1//1');
    expect(fLine).toContain('2//2');
    expect(fLine).toContain('3//3');
  });

  it('Test with a simple quad mesh (2 triangles)', () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
      1, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const indices = new Uint32Array([
      0, 1, 2,
      1, 3, 2,
    ]);

    const obj = exportOBJ(positions, normals, indices);
    const lines = obj.trim().split('\n');

    const fLines = lines.filter(l => l.startsWith('f '));
    expect(fLines.length).toBe(2);
    expect(fLines[0]).toContain('1//1');
    expect(fLines[0]).toContain('2//2');
    expect(fLines[0]).toContain('3//3');
    expect(fLines[1]).toContain('2//2');
    expect(fLines[1]).toContain('4//4');
    expect(fLines[1]).toContain('3//3');
  });
});
