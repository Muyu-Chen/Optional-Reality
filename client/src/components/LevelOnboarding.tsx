import { useEffect, useRef } from 'react';
import type { LevelOnboarding as Lesson } from '../levels/onboarding';
import { OnboardingDiagram } from './OnboardingDiagram';
import { AllowedRules } from './AllowedRules';

interface LevelOnboardingProps {
  lesson: Lesson;
  levelLabel: string;
  levelTitle: string;
  editableRules: readonly string[];
  onClose: () => void;
  onLoadStarters?: () => void;
  closeLabel?: string;
}

export function LevelOnboarding({ lesson, levelLabel, levelTitle, editableRules, onClose, onLoadStarters, closeLabel = "Let's play" }: LevelOnboardingProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeButton.current?.focus({ preventScroll: true }); }, [lesson]);
  return <div className="onboarding-scrim">
    <section className={`onboarding-card${lesson.theme === 'bakery' ? ' onboarding-card--bakery' : ''}`} role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-pause"
      onKeyDown={event => {
        if (event.key !== 'Tab' || event.shiftKey) return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
        if (event.target === buttons[buttons.length - 1]) { event.preventDefault();buttons[0]?.focus(); }
      }}>
      <span className="onboarding-eyebrow">HOW TO PLAY <b>{levelLabel} · {levelTitle}</b></span>
      <h2 id="onboarding-title">{lesson.title}</h2>
      <p id="onboarding-pause" className="onboarding-pause">Time is paused. Prepare your rules before the run.</p>
      {lesson.intro && <p className="onboarding-intro">{lesson.intro}</p>}
      {lesson.machines && <section className="onboarding-machines" aria-label="Machine setup">
        {lesson.machines.map(machine => <div key={machine.name} className={machine.editable ? 'is-editable' : 'is-preset'}>
          <span>{machine.editable ? 'YOU CONTROL' : 'PRESET'}</span><strong>{machine.name}</strong><small>{machine.state}</small>
        </div>)}
      </section>}
      <ol className="onboarding-steps">
        {lesson.steps.map((step, index) => <li key={step.title}>
          <OnboardingDiagram kind={step.diagram} />
          <h3><span>{index + 1}</span>{step.title}</h3>
          {step.commands && <div className="onboarding-commands" aria-label={`${step.title} messages`}>
            {step.commands.map(command => <code key={command}>{command}</code>)}
          </div>}
          <p>{step.body}</p>
        </li>)}
      </ol>
      {lesson.watchFor && <aside className="onboarding-watch"><strong>{lesson.watchFor.title}</strong><p>{lesson.watchFor.body}</p></aside>}
      <section className="onboarding-permissions" aria-label="Rule limits">
        <p>{lesson.theme === 'bakery'
          ? 'Only these rules can be changed in this level. The bread, pickup bag and layout stay fixed.'
          : 'Only these rules can be changed in this level. The ball, exit and layout stay fixed.'}</p>
        <AllowedRules rules={editableRules} variant="tutorial" />
      </section>
      <p className="onboarding-score"><span aria-hidden="true">★ ★ ★</span> Reach the exit to pass. Collect all three stars, then exit for full score. Before overtime, leaving the play area ends the run. After 30 seconds, you get one 30-second rescue with protective walls; an overtime clear costs one star.</p>
      <p className="onboarding-keys"><span><kbd>Enter</kbd> queue</span><span><kbd>Shift + Enter</kbd> apply current message</span><span><kbd>Shift + Tab</kbd> pause & settings</span></p>
      <div className="onboarding-actions">
        <button className="primary-button" ref={closeButton} onClick={onClose}>{closeLabel}</button>
        {onLoadStarters && <button className="onboarding-load" onClick={onLoadStarters}>{lesson.starterLabel || 'Load starter messages'}</button>}
      </div>
    </section>
  </div>;
}
