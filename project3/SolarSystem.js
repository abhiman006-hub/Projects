import * as THREE from 'three';
import { PLANETS } from './planetData.js';
import { Planet, orbitScale } from './Planet.js';
import { rng, glowTexture } from '../utils/helpers.js';

export class SolarSystem {
  constructor() {
    this.group = new THREE.Group();
    this.sunRadius = 5;
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(this.sunRadius, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    this.corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,150,1)', 'rgba(255,140,40,.35)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.corona.scale.setScalar(this.sunRadius * 6);
    this.light = new THREE.PointLight(0xfff1d6, 3.2, 0, 0); // decay 0: every planet stays readable
    this.group.add(this.sun, this.corona, this.light, new THREE.AmbientLight(0x223355, 0.35));

    this.planets = PLANETS.map((d, i) => new Planet(d, i));
    this.orbits = new THREE.Group();
    for (const p of this.planets) { this.group.add(p.group); this.orbits.add(p.orbitLine); }
    this.group.add(this.orbits);
    this.#buildBelt();
  }

  #buildBelt() {
    const n = 1800, r = rng(7), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    this.beltGeo = new THREE.IcosahedronGeometry(0.12, 0);
    this.beltMat = new THREE.MeshStandardMaterial({ color: 0x8b8379, roughness: 1 });
    this.belt = new THREE.InstancedMesh(this.beltGeo, this.beltMat, n);
    for (let i = 0; i < n; i++) {
      const rad = orbitScale(2.2 + r() * 1.1), a = r() * 6.2832;
      p.set(Math.cos(a) * rad, (r() - 0.5) * 1.6, Math.sin(a) * rad);
      q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)); s.setScalar(0.4 + r() * 1.4);
      this.belt.setMatrixAt(i, m.compose(p, q, s));
    }
    this.group.add(this.belt);
  }

  update(simDays, dt) {
    for (const p of this.planets) p.update(simDays, dt);
    this.belt.rotation.y += dt * 0.01;
  }
  setOrbitsVisible(v) { this.orbits.visible = v; }
  setBeltVisible(v) { this.belt.visible = v; }
}
