import { useEffect, useRef } from 'react';
import { MusicControl } from '../MusicControl';
import { SoundEffectsControl } from '../SoundEffectsControl';

export function FrontDoorSettings({ onClose, returnFocus }: { onClose: () => void; returnFocus?: HTMLElement | null }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    // The background becomes inert before effects run and can already have lost focus.
    const previous = returnFocus || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = controls?.[0], last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose, returnFocus]);
  return <div className="journey-settings-shade">
    <section className="journey-settings" ref={panel} role="dialog" aria-modal="true" aria-labelledby="journey-settings-title">
      <div className="journey-settings-heading"><span className="journey-eyebrow">MAKE YOURSELF AT HOME</span>
        <button className="journey-close" aria-label="Close settings" onClick={onClose}>×</button></div>
      <h2 id="journey-settings-title">Set the mood.</h2>
      <div className="journey-audio"><MusicControl /><SoundEffectsControl /></div>
      <h3>Small keys. Big changes.</h3>
      <dl className="journey-controls">
        <div><dt><kbd>Enter</kbd></dt><dd>Prepare a message in the queue</dd></div>
        <div><dt><kbd>Shift</kbd> + <kbd>Enter</kbd></dt><dd>Apply your current message</dd></div>
        <div><dt><kbd>Shift</kbd> + <kbd>Tab</kbd></dt><dd>Pause and open the game menu</dd></div>
      </dl>
      <p>Prepare your rules first. You choose when to send them. Touch the exit to finish; collect all three stars for full score.</p>
      <button className="journey-button journey-button--primary" onClick={onClose}>All set <span aria-hidden="true">✓</span></button>
    </section>
  </div>;
}
