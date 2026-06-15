export function exportOBJ(positions: Float32Array, normals: Float32Array, indices: Uint32Array): string {
  const lines: string[] = [];

  lines.push('# Terrain Engine OBJ Export');

  const vertexCount = positions.length / 3;
  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    lines.push(`v ${x} ${y} ${z}`);
  }

  const normalCount = normals.length / 3;
  for (let i = 0; i < normalCount; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    lines.push(`vn ${nx} ${ny} ${nz}`);
  }

  const faceCount = indices.length / 3;
  for (let i = 0; i < faceCount; i++) {
    const i1 = indices[i * 3] + 1;
    const i2 = indices[i * 3 + 1] + 1;
    const i3 = indices[i * 3 + 2] + 1;
    lines.push(`f ${i1}//${i1} ${i2}//${i2} ${i3}//${i3}`);
  }

  return lines.join('\n') + '\n';
}

export function downloadOBJ(positions: Float32Array, normals: Float32Array, indices: Uint32Array, filename: string): void {
  const objString = exportOBJ(positions, normals, indices);
  const blob = new Blob([objString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
