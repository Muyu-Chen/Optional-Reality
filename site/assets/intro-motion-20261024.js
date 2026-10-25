import { DiagramPlayer } from './diagram-player-20261024.js';
import { drawSpring } from './diagram-spring-20261024.js';
import { drawOrbit } from './diagram-orbit-20261024.js';

const cleanups = [];
function listen(target, name, callback, options) {
  target.addEventListener(name, callback, options);
  cleanups.push(() => target.removeEventListener(name, callback, options));
}
const dialog = document.querySelector('#github-dialog');
if (dialog) {
  for (const trigger of document.querySelectorAll('[data-github]')) listen(trigger, 'click', () => dialog.showModal());
  for (const close of document.querySelectorAll('[data-close-dialog]')) listen(close, 'click', () => dialog.close());
  listen(dialog, 'click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

const players = [];
for (const canvas of document.querySelectorAll('[data-diagram]')) {
  try {
    const paint = canvas.dataset.diagram === 'spring' ? drawSpring : drawOrbit;
    const player = new DiagramPlayer(canvas, paint);
    if (player.available) players.push(player);
    else player.destroy();
  } catch {
    // If Canvas is unavailable, the original local poster remains visible.
    canvas.parentElement.classList.remove('diagram-ready');
  }
}

const buttons = document.querySelectorAll('[data-motion-toggle]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
function updateMotion() {
  const reduced = reducedMotion.matches;
  for (const player of players) { player.setReducedMotion(reduced); player.setPaused(paused); }
  for (const button of buttons) {
    button.disabled = !players.length || reduced;
    button.setAttribute('aria-pressed', String(paused || reduced));
    button.textContent = reduced ? 'Reduced motion' : paused ? 'Play animations' : 'Pause animations';
    button.title = reduced ? 'Animations follow your system’s reduced-motion preference.' : 'Pause or resume these two illustrated experiments.';
  }
}
for (const button of buttons) listen(button, 'click', () => { paused = !paused; updateMotion(); });
listen(reducedMotion, 'change', updateMotion);
listen(window, 'pagehide', event => {
  if (event.persisted) { for (const player of players) player.setPageActive(false); return; }
  for (const player of players) player.destroy();
  for (const cleanup of cleanups) cleanup();
});
listen(window, 'pageshow', () => { for (const player of players) player.setPageActive(true); });
updateMotion();
