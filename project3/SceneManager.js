import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 6000);
    this.camera.position.set(0, 90, 190);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.06, minDistance: 6, maxDistance: 700 });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.6, 0.85);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.clock = new THREE.Clock();
    this.updaters = [];
    this.onResize = this.onResize.bind(this);
    addEventListener('resize', this.onResize);
    this.onResize();
  }

  /** Register a per-frame callback: fn(dt, elapsed). */
  addUpdater(fn) { this.updaters.push(fn); }

  onResize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, matchMedia('(max-width: 800px)').matches ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr); this.renderer.setSize(w, h);
    this.composer.setPixelRatio(dpr); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), 0.1), t = this.clock.elapsedTime; // clamp avoids jumps after tab switches
      for (const fn of this.updaters) fn(dt, t);
      this.controls.update();
      this.composer.render();
    });
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    removeEventListener('resize', this.onResize);
    this.controls.dispose(); this.renderer.dispose();
  }
}
