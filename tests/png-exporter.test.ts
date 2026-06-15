import { describe, it, expect } from 'vitest';
import { exportHeightmapPNG } from '../src/export/png-exporter';

describe('PNG Exporter', () => {
  function createTestHeightmap(width: number, height: number): Float32Array {
    const data = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      data[i] = i / (width * height);
    }
    return data;
  }

  async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  function findChunk(data: Uint8Array, type: string): { offset: number; length: number } | null {
    const signatureLength = 8;
    let offset = signatureLength;
    while (offset < data.length) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const chunkLength = view.getUint32(offset, false);
      const chunkType = String.fromCharCode(
        data[offset + 4],
        data[offset + 5],
        data[offset + 6],
        data[offset + 7]
      );
      if (chunkType === type) {
        return { offset, length: chunkLength };
      }
      offset += 12 + chunkLength;
    }
    return null;
  }

  it('exportHeightmapPNG with a small test heightmap', async () => {
    const width = 4;
    const height = 4;
    const heightmap = createTestHeightmap(width, height);
    const blob = exportHeightmapPNG(heightmap, width, height);
    expect(blob.type).toBe('image/png');
    const data = await blobToUint8Array(blob);
    expect(data.length).toBeGreaterThan(0);
  });

  it('Verify the output Blob has PNG signature', async () => {
    const width = 4;
    const height = 4;
    const heightmap = createTestHeightmap(width, height);
    const blob = exportHeightmapPNG(heightmap, width, height);
    const data = await blobToUint8Array(blob);
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      expect(data[i]).toBe(signature[i]);
    }
  });

  it('Verify PNG has valid IHDR, IDAT, IEND chunks', async () => {
    const width = 4;
    const height = 4;
    const heightmap = createTestHeightmap(width, height);
    const blob = exportHeightmapPNG(heightmap, width, height);
    const data = await blobToUint8Array(blob);

    const ihdr = findChunk(data, 'IHDR');
    expect(ihdr).not.toBeNull();
    expect(ihdr!.length).toBe(13);

    const idat = findChunk(data, 'IDAT');
    expect(idat).not.toBeNull();
    expect(idat!.length).toBeGreaterThan(0);

    const iend = findChunk(data, 'IEND');
    expect(iend).not.toBeNull();
    expect(iend!.length).toBe(0);
  });

  it('Verify same input produces same output bytes (deterministic)', async () => {
    const width = 4;
    const height = 4;
    const heightmap = createTestHeightmap(width, height);
    const blob1 = exportHeightmapPNG(heightmap, width, height);
    const blob2 = exportHeightmapPNG(heightmap, width, height);
    const data1 = await blobToUint8Array(blob1);
    const data2 = await blobToUint8Array(blob2);
    expect(data1.length).toBe(data2.length);
    for (let i = 0; i < data1.length; i++) {
      expect(data1[i]).toBe(data2[i]);
    }
  });

  it('Test with 16-bit values: ensure pixel 0 = 0, pixel max = 65535', async () => {
    const width = 2;
    const height = 1;
    const heightmap = new Float32Array([0, 1]);
    const blob = exportHeightmapPNG(heightmap, width, height);
    const data = await blobToUint8Array(blob);

    const idat = findChunk(data, 'IDAT');
    expect(idat).not.toBeNull();

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const zlibStart = idat!.offset + 8;
    const zlibData = data.subarray(zlibStart, zlibStart + idat!.length);

    const cmf = zlibData[0];
    const flg = zlibData[1];
    expect((cmf & 0x0F)).toBe(8);
    expect(((cmf << 8) + flg) % 31).toBe(0);

    const rawDataOffset = 2;
    const isFinal = zlibData[rawDataOffset] & 1;
    expect(isFinal).toBe(1);
    const blockSize = (zlibData[rawDataOffset + 2] | (zlibData[rawDataOffset + 3] << 8));
    const blockData = zlibData.subarray(rawDataOffset + 5, rawDataOffset + 5 + blockSize);

    const rowSize = 1 + width * 2;
    expect(blockData[0]).toBe(0);
    expect(blockData[1]).toBe(0);
    expect(blockData[2]).toBe(0);
    expect(blockData[3]).toBe(0xFF);
    expect(blockData[4]).toBe(0xFF);
  });
});
