const githubDialog = document.querySelector('#github-dialog');
for (const trigger of document.querySelectorAll('[data-github]')) {
  trigger.addEventListener('click', () => githubDialog.showModal());
}
for (const close of document.querySelectorAll('[data-close-dialog]')) {
  close.addEventListener('click', () => githubDialog.close());
}
githubDialog.addEventListener('click', (event) => {
  const bounds = githubDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    githubDialog.close();
  }
});

const motionButtons = document.querySelectorAll('[data-motion-toggle]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let userChoseMotion = false;
function updateMotion() {
  document.body.classList.toggle('motion-paused', paused);
  document.body.classList.toggle('motion-enabled', !paused);
  for (const button of motionButtons) {
    button.disabled = false;
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Play animations' : 'Pause animations';
  }
}
for (const button of motionButtons) {
  button.addEventListener('click', () => {
    userChoseMotion = true;
    paused = !paused;
    updateMotion();
  });
}
reducedMotion.addEventListener('change', (event) => {
  if (!userChoseMotion) {
    paused = event.matches;
    updateMotion();
  }
});
updateMotion();
