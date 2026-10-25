import { useEffect, useRef, useState } from 'react';
import { LevelOnboarding } from '../LevelOnboarding';
import { findLevel } from '../../levels/catalog';
import { onboardingFor } from '../../levels/onboarding';
import { editableRuleLabels } from '../../levels/presentation';
import { levelLabel } from '../../levels/progression';
import { MusicControl } from '../MusicControl';
import { SoundEffectsControl } from '../SoundEffectsControl';

export function FrontDoorSettings({ onClose, returnFocus, levelId }: { onClose: () => void; returnFocus?: HTMLElement | null; levelId?: string }) {
  const panel = useRef<HTMLElement>(null);
  const [tutorial, setTutorial] = useState(false);
  const tutorialButton = useRef<HTMLButtonElement>(null);
  const requested = findLevel(levelId || 'gravity-lab');
  const level = requested && onboardingFor(requested.id) ? requested : findLevel('gravity-lab')!;
  const lesson = onboardingFor(level.id)!;
  useEffect(() => {
    // The background becomes inert before effects run and can already have lost focus.
    const previous = returnFocus || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); if (tutorial) { setTutorial(false); requestAnimationFrame(() => tutorialButton.current?.focus()); } else onClose(); }
      if (event.key !== 'Tab') return;
      const controls = panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = controls?.[0], last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose, returnFocus, tutorial]);
  if (tutorial) return <LevelOnboarding lesson={lesson} levelTitle={level.title} levelLabel={levelLabel(level)}
    editableRules={editableRuleLabels(level)} closeLabel="Back to settings" onClose={() => {
      setTutorial(false); requestAnimationFrame(() => tutorialButton.current?.focus());
    }} />;
  return <div className="journey-settings-shade">
    <section className="journey-settings" ref={panel} role="dialog" aria-modal="true" aria-labelledby="journey-settings-title">
      <div className="journey-settings-heading"><span className="journey-eyebrow">MAKE YOURSELF AT HOME</span>
        <button className="journey-close" aria-label="Close settings" onClick={onClose}>×</button></div>
      <h2 id="journey-settings-title">Set the mood.</h2>
      <div className="journey-audio"><MusicControl /><SoundEffectsControl /></div>
      <button ref={tutorialButton} className="journey-button journey-button--secondary" onClick={() => setTutorial(true)}>Replay beginner tutorial <span aria-hidden="true">↺</span></button>
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
