function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): [number, number, number] {
  return [lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)];
}

export function generateColors(
  heights: Float32Array,
  normals: Float32Array,
  vertexCount: number,
  waterLevel: number,
): Float32Array {
  const colors = new Float32Array(vertexCount * 3);
  const blendWidth = 0.05;
  const sandEnd = waterLevel + 0.02;

  for (let i = 0; i < vertexCount; i++) {
    const h = heights[i];
    const ny = normals[i * 3 + 1];
    const slope = 1 - ny;
    let r: number, g: number, b: number;

    if (h < waterLevel) {
      r = 0.06; g = 0.22; b = 0.38;
    } else if (h < sandEnd) {
      if (h < waterLevel + blendWidth) {
        const t = (h - waterLevel) / blendWidth;
        [r, g, b] = lerpColor(0.06, 0.22, 0.38, 0.76, 0.70, 0.50, t);
      } else if (h > sandEnd - blendWidth) {
        const t = (h - (sandEnd - blendWidth)) / blendWidth;
        if (slope < 0.7) {
          [r, g, b] = lerpColor(0.76, 0.70, 0.50, 0.22, 0.55, 0.14, t);
        } else {
          [r, g, b] = lerpColor(0.76, 0.70, 0.50, 0.45, 0.42, 0.40, t);
        }
      } else {
        r = 0.76; g = 0.70; b = 0.50;
      }
    } else if (h < 0.75) {
      const grassR = 0.22, grassG = 0.55, grassB = 0.14;
      const rockR = 0.45, rockG = 0.42, rockB = 0.40;

      if (slope < 0.7) {
        if (slope > 0.7 - blendWidth) {
          const t = (slope - (0.7 - blendWidth)) / blendWidth;
          [r, g, b] = lerpColor(grassR, grassG, grassB, rockR, rockG, rockB, t);
        } else {
          r = grassR; g = grassG; b = grassB;
        }
      } else {
        r = rockR; g = rockG; b = rockB;
      }

      if (h < sandEnd + blendWidth && h >= sandEnd) {
        const t = (h - sandEnd) / blendWidth;
        const baseR = r, baseG = g, baseB = b;
        [r, g, b] = lerpColor(0.76, 0.70, 0.50, baseR, baseG, baseB, t);
      }
    } else {
      const snowR = 0.92, snowG = 0.93, snowB = 0.95;
      const rockR = 0.45, rockG = 0.42, rockB = 0.40;

      if (h < 0.75 + blendWidth) {
        const t = (h - 0.75) / blendWidth;
        [r, g, b] = lerpColor(rockR, rockG, rockB, snowR, snowG, snowB, t);
      } else {
        r = snowR; g = snowG; b = snowB;
      }
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  return colors;
}
