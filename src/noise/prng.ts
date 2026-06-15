export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPermTable(seed: number): Uint8Array {
  const rng = mulberry32(seed);
  const table = new Uint8Array(512);
  for (let i = 0; i < 256; i++) {
    table[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = table[i];
    table[i] = table[j];
    table[j] = tmp;
  }
  for (let i = 0; i < 256; i++) {
    table[i + 256] = table[i];
  }
  return table;
}
