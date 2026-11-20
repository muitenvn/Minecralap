// Fast deterministic seeded 2D & 3D value/gradient noise for ±29,999,984 world generation

export class SeededNoise {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed | 0;
  }

  private hash2(x: number, z: number): number {
    let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(this.seed, 1442695041);
    h = (h ^ (h >>> 13)) | 0;
    h = Math.imul(h, 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  private hash3(x: number, y: number, z: number): number {
    let h =
      Math.imul(x, 374761393) +
      Math.imul(y, 1274126177) +
      Math.imul(z, 668265263) +
      Math.imul(this.seed, 1442695041);
    h = (h ^ (h >>> 13)) | 0;
    h = Math.imul(h, 1103515245);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  noise2D(x: number, z: number): number {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = this.fade(x - xi);
    const zf = this.fade(z - zi);

    const n00 = this.hash2(xi, zi);
    const n10 = this.hash2(xi + 1, zi);
    const n01 = this.hash2(xi, zi + 1);
    const n11 = this.hash2(xi + 1, zi + 1);

    const nx0 = this.lerp(n00, n10, xf);
    const nx1 = this.lerp(n01, n11, xf);
    return this.lerp(nx0, nx1, zf) * 2 - 1;
  }

  noise3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = this.fade(x - xi);
    const yf = this.fade(y - yi);
    const zf = this.fade(z - zi);

    const c000 = this.hash3(xi, yi, zi);
    const c100 = this.hash3(xi + 1, yi, zi);
    const c010 = this.hash3(xi, yi + 1, zi);
    const c110 = this.hash3(xi + 1, yi + 1, zi);
    const c001 = this.hash3(xi, yi, zi + 1);
    const c101 = this.hash3(xi + 1, yi, zi + 1);
    const c011 = this.hash3(xi, yi + 1, zi + 1);
    const c111 = this.hash3(xi + 1, yi + 1, zi + 1);

    const x00 = this.lerp(c000, c100, xf);
    const x10 = this.lerp(c010, c110, xf);
    const x01 = this.lerp(c001, c101, xf);
    const x11 = this.lerp(c011, c111, xf);

    const y0 = this.lerp(x00, x10, yf);
    const y1 = this.lerp(x01, x11, yf);
    return this.lerp(y0, y1, zf) * 2 - 1;
  }

  fbm2D(x: number, z: number, octaves = 4): number {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      val += this.noise2D(x * freq, z * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.02;
    }
    return val / norm;
  }

  rand2(x: number, z: number, salt = 0): number {
    return this.hash3(x, salt, z);
  }

  rand3(x: number, y: number, z: number): number {
    return this.hash3(x, y, z);
  }
}
