import * as THREE from 'three';
import { makeTexture, clamp } from '../utils/helpers.js';

// DISPLAY SCALING (not true scale): distance = 14 * AU^0.62 ; radius = 0.9 * (R / R_earth)^0.45
export const orbitScale = (au) => 14 * Math.pow(au, 0.62);
export const sizeScale = (km) => 0.9 * Math.pow(km / 6371, 0.45);
const sphere = new THREE.SphereGeometry(1, 48, 32); // shared by all bodies

export class Planet {
  constructor(data, index) {
    this.data = data;
    this.radius = sizeScale(data.radiusKm);
    this.a = orbitScale(data.aAU);
    this.b = this.a * Math.sqrt(1 - data.ecc * data.ecc);
    this.phase = index * 2.1; // fixed starting angle: layout is identical on every load
    this.spin = Math.sign(data.rotationHours) * clamp(24 / Math.abs(data.rotationHours), 0.15, 2.5) * 0.4; // visual rate only

    this.group = new THREE.Group();                       // follows the orbit
    this.tilt = new THREE.Group();                        // axial tilt
    this.tilt.rotation.z = THREE.MathUtils.degToRad(data.tiltDeg);
    this.material = new THREE.MeshStandardMaterial({ map: makeTexture(data.tex, index + 3), roughness: 0.92 });
    this.body = new THREE.Mesh(sphere, this.material);
    this.body.scale.setScalar(this.radius);
    this.body.userData.planet = this;                    // used later by raycasting
    this.tilt.add(this.body); this.group.add(this.tilt);
    if (data.rings) this.#addRings(data.rings);
    this.orbitLine = this.#buildOrbit();
  }

  #addRings({ inner, outer, color }) {
    const geo = new THREE.RingGeometry(this.radius * inner, this.radius * outer, 96, 1), p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() / this.radius - inner) / (outer - inner), 0.5); }
    const c = document.createElement('canvas'); c.width = 256; c.height = 4;
    const g = c.getContext('2d');
    for (let x = 0; x < 256; x++) { g.fillStyle = color; g.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(x * 0.45) * Math.cos(x * 0.11)); g.fillRect(x, 0, 1, 4); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2;
    this.tilt.add(this.ring);
  }

  #buildOrbit() {
    const pts = [];
    for (let i = 0; i < 256; i++) { const E = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(this.a * (Math.cos(E) - this.data.ecc), 0, this.b * Math.sin(E))); }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4cc3ff, transparent: true, opacity: 0.18 }));
  }

  /** Kepler's equation (4 fixed-point iterations) with the Sun at one focus. Allocation-free. */
  update(simDays, dt) {
    const e = this.data.ecc, M = (simDays / this.data.periodDays) * 6.2832 + this.phase;
    let E = M; for (let i = 0; i < 4; i++) E = M + e * Math.sin(E);
    this.group.position.set(this.a * (Math.cos(E) - e), 0, this.b * Math.sin(E));
    this.body.rotation.y += this.spin * dt;
  }

  dispose() { this.material.map.dispose(); this.material.dispose(); this.orbitLine.geometry.dispose(); this.orbitLine.material.dispose(); }
}
