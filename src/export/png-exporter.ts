const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function createPNGChunk(type: string, data: Uint8Array): Uint8Array {
  const length = data.length;
  const chunk = new Uint8Array(12 + length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, length, false);

  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);

  chunk.set(data, 8);

  const typeAndData = new Uint8Array(4 + length);
  typeAndData[0] = type.charCodeAt(0);
  typeAndData[1] = type.charCodeAt(1);
  typeAndData[2] = type.charCodeAt(2);
  typeAndData[3] = type.charCodeAt(3);
  typeAndData.set(data, 4);

  view.setUint32(8 + length, crc32(typeAndData), false);

  return chunk;
}

function deflateStored(data: Uint8Array): Uint8Array {
  const maxBlockSize = 65535;
  const numBlocks = Math.ceil(data.length / maxBlockSize) || 1;
  const output = new Uint8Array(numBlocks * 5 + data.length);
  const view = new DataView(output.buffer);
  let offset = 0;
  let dataOffset = 0;

  for (let i = 0; i < numBlocks; i++) {
    const remaining = data.length - dataOffset;
    const blockSize = Math.min(remaining, maxBlockSize);
    const isFinal = i === numBlocks - 1 ? 1 : 0;

    output[offset] = isFinal;

    view.setUint16(offset + 1, blockSize, true);
    view.setUint16(offset + 3, blockSize ^ 0xFFFF, true);

    output.set(data.subarray(dataOffset, dataOffset + blockSize), offset + 5);

    offset += 5 + blockSize;
    dataOffset += blockSize;
  }

  return output.subarray(0, offset);
}

function zlibCompress(data: Uint8Array): Uint8Array {
  const deflated = deflateStored(data);
  const checksum = adler32(data);

  const result = new Uint8Array(2 + deflated.length + 4);
  const view = new DataView(result.buffer);

  result[0] = 0x78;
  result[1] = 0x01;

  result.set(deflated, 2);

  view.setUint32(2 + deflated.length, checksum, false);

  return result;
}

export function exportHeightmapPNG(heightmap: Float32Array, width: number, height: number): Blob {
  const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdrData[8] = 16;
  ihdrData[9] = 0;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createPNGChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 2;
  const rawData = new Uint8Array(height * rowSize);
  const rawView = new DataView(rawData.buffer);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const h = heightmap[y * width + x];
      const value = Math.max(0, Math.min(65535, Math.round(h * 65535)));
      rawView.setUint16(rowOffset + 1 + x * 2, value, false);
    }
  }

  const compressedData = zlibCompress(rawData);
  const idatChunk = createPNGChunk('IDAT', compressedData);

  const iendChunk = createPNGChunk('IEND', new Uint8Array(0));

  const totalSize = PNG_SIGNATURE.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalSize);
  let offset = 0;

  png.set(PNG_SIGNATURE, offset);
  offset += PNG_SIGNATURE.length;

  png.set(ihdrChunk, offset);
  offset += ihdrChunk.length;

  png.set(idatChunk, offset);
  offset += idatChunk.length;

  png.set(iendChunk, offset);

  return new Blob([png], { type: 'image/png' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
