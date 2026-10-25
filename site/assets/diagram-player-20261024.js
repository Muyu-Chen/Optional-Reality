export function browserRuntime() {
  return {
    window, document,
    requestFrame: callback => window.requestAnimationFrame(callback),
    cancelFrame: id => window.cancelAnimationFrame(id),
    createIntersectionObserver: typeof IntersectionObserver === 'undefined' ? null : callback => new IntersectionObserver(callback, { threshold: .01 }),
    createResizeObserver: typeof ResizeObserver === 'undefined' ? null : callback => new ResizeObserver(callback),
  };
}

/** A drawing clock, not a game simulation. Offscreen time never advances its timeline. */
export class DiagramPlayer {
  constructor(canvas, paint, runtime = browserRuntime()) {
    this.canvas = canvas;
    this.paint = paint;
    this.runtime = runtime;
    this.frame = null;
    this.lastTimestamp = null;
    this.elapsed = 0;
    this.paused = false;
    this.reduced = false;
    this.pageActive = true;
    this.disposed = false;
    this.visible = false;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) { this.available = false; return; }
    this.available = true;
    this.onVisibility = () => this.updateRunning();
    this.onResize = () => { this.resize(); if (!this.intersection) this.checkVisibility(); };
    this.onScroll = () => this.checkVisibility();
    runtime.document.addEventListener('visibilitychange', this.onVisibility);
    runtime.window.addEventListener('resize', this.onResize, { passive: true });
    this.resizeObserver = runtime.createResizeObserver?.(() => this.resize());
    this.resizeObserver?.observe(canvas.parentElement);
    this.intersection = runtime.createIntersectionObserver?.(entries => {
      for (const entry of entries) if (entry.target === canvas) {
        this.visible = entry.isIntersecting && entry.intersectionRatio > 0;
        this.updateRunning();
      }
    });
    if (this.intersection) this.intersection.observe(canvas);
    else runtime.window.addEventListener('scroll', this.onScroll, { passive: true });
    try {
      this.resize();
      canvas.parentElement.classList.add('diagram-ready');
      this.checkVisibility();
    } catch {
      // A partially supported 2D API still gets the static-poster fallback and cleanup.
      this.destroy();
      this.available = false;
    }
  }

  setPaused(value) { this.paused = value; this.updateRunning(); }
  setReducedMotion(value) {
    this.reduced = value;
    this.canvas.parentElement.classList.toggle('diagram-static', value);
    this.updateRunning();
  }
  setPageActive(value) { this.pageActive = value; this.updateRunning(); }

  checkVisibility() {
    const rect = this.canvas.getBoundingClientRect();
    this.visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < this.runtime.window.innerHeight &&
      rect.right > 0 && rect.left < this.runtime.window.innerWidth;
    this.updateRunning();
  }

  resize() {
    if (!this.available || this.disposed) return;
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(2.5, Math.max(1, this.runtime.window.devicePixelRatio || 1));
    const width = Math.round(bounds.width * dpr), height = Math.round(bounds.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
    this.context.setTransform(width / 640, 0, 0, height / 360, 0, 0);
    this.paint(this.context, this.elapsed);
  }

  updateRunning() {
    if (!this.available || this.disposed) return;
    const running = !this.paused && !this.reduced && this.visible && this.pageActive && this.runtime.document.visibilityState !== 'hidden';
    if (!running) {
      if (this.frame !== null) this.runtime.cancelFrame(this.frame);
      this.frame = null; this.lastTimestamp = null;
    } else if (this.frame === null) {
      this.frame = this.runtime.requestFrame(timestamp => this.tick(timestamp));
    }
  }

  tick(timestamp) {
    this.frame = null;
    if (this.disposed) return;
    if (this.lastTimestamp !== null) {
      // Actual RAF time keeps 60/120 Hz identical. A stalled frame cannot skip a whole phase.
      this.elapsed += Math.min(.05, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    }
    this.lastTimestamp = timestamp;
    this.paint(this.context, this.elapsed);
    this.updateRunning();
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== null) this.runtime.cancelFrame(this.frame);
    this.frame = null;
    this.intersection?.disconnect(); this.resizeObserver?.disconnect();
    this.runtime.document.removeEventListener('visibilitychange', this.onVisibility);
    this.runtime.window.removeEventListener('resize', this.onResize);
    this.runtime.window.removeEventListener('scroll', this.onScroll);
    this.canvas.parentElement.classList.remove('diagram-ready', 'diagram-static');
  }
}
