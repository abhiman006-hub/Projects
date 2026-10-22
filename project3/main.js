import './style.css';
import { SceneManager } from './scene/SceneManager.js';
import { Starfield } from './scene/Starfield.js';
import { SolarSystem } from './celestial/SolarSystem.js';

const loader = document.getElementById('loader');
const bar = document.getElementById('loader-bar'), msg = document.getElementById('loader-msg');
const step = (pct, text) => { bar.style.width = pct + '%'; msg.textContent = text; };
const frame = () => new Promise(requestAnimationFrame); // yield so progress can paint

async function boot() {
  step(10, 'Igniting the Sun…'); await frame();
  const manager = new SceneManager(document.getElementById('app'));
  step(35, 'Scattering stars…'); await frame();
  const stars = new Starfield(6000);
  manager.scene.add(stars.points);
  step(65, 'Placing planets on their orbits…'); await frame();
  const system = new SolarSystem();
  manager.scene.add(system.group);

  // Simulation clock in days (Stage 6 adds play/pause and speed UI on top of this).
  const sim = { days: 0, speed: 20, running: true };
  manager.addUpdater((dt) => { if (sim.running) sim.days += dt * sim.speed; system.update(sim.days, dt); });

  step(100, 'Ready'); await frame();
  manager.start();
  loader.classList.add('done');
}

boot().catch((err) => {
  console.error(err);
  loader.classList.add('error');
  msg.textContent = 'Could not start the 3D scene. Check that WebGL is enabled and reload.';
});
