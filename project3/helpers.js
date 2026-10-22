import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Deterministic seeded RNG (mulberry32) so the scene never changes between loads. */
export const rng = (s) => () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Procedural surface texture (no external assets needed). type: 'bands' | 'rock' | 'earth' */
export function makeTexture({ type, colors }, seed = 1) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = colors[0]; g.fillRect(0, 0, 512, 256);
  const pick = () => colors[1 + Math.floor(r() * (colors.length - 1))];
  if (type === 'bands') {
    for (let y = 0; y < 256;) { const h = 6 + r() * 22; g.fillStyle = pick(); g.globalAlpha = 0.35 + r() * 0.5; g.fillRect(0, y, 512, h); y += h; }
  } else {
    const n = type === 'earth' ? 140 : 260, max = type === 'earth' ? 26 : 14;
    for (let i = 0; i < n; i++) { g.fillStyle = pick(); g.globalAlpha = 0.25 + r() * 0.5; g.beginPath(); g.arc(r() * 512, r() * 256, 4 + r() * max, 0, 6.2832); g.fill(); }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** Soft radial glow used for the solar corona. */
export function glowTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner); grd.addColorStop(0.35, outer); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
