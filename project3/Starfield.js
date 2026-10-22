import * as THREE from 'three';
import { rng } from '../utils/helpers.js';

/** Static star shell: colours and brightness vary per star; built once, never rebuilt per frame. */
export class Starfield {
  constructor(count = 6000) {
    const r = rng(42), pos = new Float32Array(count * 3), col = new Float32Array(count * 3), c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const rad = 1800 + r() * 1200, th = r() * 6.2832, ph = Math.acos(2 * r() - 1);
      pos.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph), rad * Math.sin(ph) * Math.sin(th)], i * 3);
      c.setHSL(r() < 0.5 ? 0.6 : r() < 0.7 ? 0.08 : 0.55, 0.5 * r(), 0.55 + r() * 0.45);
      col.set([c.r, c.g, c.b], i * 3);
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.material = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false });
    this.points = new THREE.Points(this.geometry, this.material);
  }
  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
