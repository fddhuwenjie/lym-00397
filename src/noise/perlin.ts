import { createPermTable } from "./prng";

const GRAD2 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const GRAD3 = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

function dot3(g: number[], x: number, y: number, z: number): number {
  return g[0] * x + g[1] * y + g[2] * z;
}

export class PerlinNoise {
  private perm: Uint8Array;

  constructor(seed: number) {
    this.perm = createPermTable(seed);
  }

  noise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const g00 = GRAD2[aa & 3];
    const g10 = GRAD2[ba & 3];
    const g01 = GRAD2[ab & 3];
    const g11 = GRAD2[bb & 3];

    const n00 = dot2(g00, xf, yf);
    const n10 = dot2(g10, xf - 1, yf);
    const n01 = dot2(g01, xf, yf - 1);
    const n11 = dot2(g11, xf - 1, yf - 1);

    const nx0 = lerp(n00, n10, u);
    const nx1 = lerp(n01, n11, u);
    return lerp(nx0, nx1, v);
  }

  noise3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const aaa = this.perm[this.perm[this.perm[xi] + yi] + zi];
    const aba = this.perm[this.perm[this.perm[xi] + yi + 1] + zi];
    const aab = this.perm[this.perm[this.perm[xi] + yi] + zi + 1];
    const abb = this.perm[this.perm[this.perm[xi] + yi + 1] + zi + 1];
    const baa = this.perm[this.perm[this.perm[xi + 1] + yi] + zi];
    const bba = this.perm[this.perm[this.perm[xi + 1] + yi + 1] + zi];
    const bab = this.perm[this.perm[this.perm[xi + 1] + yi] + zi + 1];
    const bbb = this.perm[this.perm[this.perm[xi + 1] + yi + 1] + zi + 1];

    const g000 = GRAD3[aaa % 12];
    const g010 = GRAD3[aba % 12];
    const g001 = GRAD3[aab % 12];
    const g011 = GRAD3[abb % 12];
    const g100 = GRAD3[baa % 12];
    const g110 = GRAD3[bba % 12];
    const g101 = GRAD3[bab % 12];
    const g111 = GRAD3[bbb % 12];

    const n000 = dot3(g000, xf, yf, zf);
    const n010 = dot3(g010, xf, yf - 1, zf);
    const n001 = dot3(g001, xf, yf, zf - 1);
    const n011 = dot3(g011, xf, yf - 1, zf - 1);
    const n100 = dot3(g100, xf - 1, yf, zf);
    const n110 = dot3(g110, xf - 1, yf - 1, zf);
    const n101 = dot3(g101, xf - 1, yf, zf - 1);
    const n111 = dot3(g111, xf - 1, yf - 1, zf - 1);

    const nx00 = lerp(n000, n100, u);
    const nx10 = lerp(n010, n110, u);
    const nx01 = lerp(n001, n101, u);
    const nx11 = lerp(n011, n111, u);

    const nxy0 = lerp(nx00, nx10, v);
    const nxy1 = lerp(nx01, nx11, v);

    return lerp(nxy0, nxy1, w);
  }
}
