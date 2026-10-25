import { useCallback, useEffect, useRef, useState } from 'react';
import { findLevel, levels } from '../../levels/catalog';
import { availableStars, journeyStars, type JourneyProgress } from '../../game/journey-progress';
import { TitleIllustration } from './TitleIllustration';
import { FrontDoorSettings } from './FrontDoorSettings';
import { LevelSelect } from './LevelSelect';

export function FrontDoor({ view, progress, storageAvailable, onPlay, onTitle, onLevelSelect }: {
  view: 'title' | 'levels'; progress: JourneyProgress; storageAvailable: boolean;
  onPlay: (id: string) => void; onTitle: () => void; onLevelSelect: () => void;
}) {
  const [settings, setSettings] = useState(false);
  const page = useRef<HTMLElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const closeSettings = useCallback(() => setSettings(false), []);
  const recent = findLevel(progress.lastLevel || '');
  useEffect(() => {
    // A new screen starts at its heading, including browser back/forward navigation.
    setSettings(false);
    page.current?.scrollTo?.(0, 0);
    page.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [view]);
  return <main className={`journey-shell journey-shell--${view}`} ref={page}>
    <div className="journey-content" inert={settings || undefined}>
      <header className="journey-header"><button className="journey-logo" aria-label="Optional Reality title screen" onClick={onTitle}>
        <span>or</span><strong>OPTIONAL REALITY</strong></button>
        <button className="journey-settings-button" ref={settingsTrigger} onClick={() => setSettings(true)}><span aria-hidden="true">⚙</span> Settings</button></header>
      {view === 'levels' ? <LevelSelect key={progress.lastLevel} progress={progress} onPlay={onPlay} onBack={onTitle} />
        : <section className="journey-title" aria-labelledby="journey-title">
          <div className="journey-title-copy"><span className="journey-eyebrow">STEEL & STEAM · A WORLD OF POSSIBILITY.</span>
            <h1 id="journey-title" tabIndex={-1} aria-label="Reality is optional.">Reality is<br /><em>optional.</em></h1>
            <p className="journey-tagline">Change the rules.<br />Choose the moment.</p>
            <p className="journey-pitch">A ball, a few stars, and a world that listens. Write a message. See what happens.</p>
            <div className="journey-title-actions">
              <button className="journey-button journey-button--primary" onClick={() => onPlay(recent?.id || levels[0].id)}>
                {recent ? 'Continue journey' : 'Let’s play'} <span aria-hidden="true">→</span></button>
              <button className="journey-button journey-button--secondary" onClick={onLevelSelect}>Choose a level <span aria-hidden="true">▦</span></button>
            </div>
            <p className="journey-continue-note">{recent ? <>Return to <strong>{recent.title}</strong>.<br />A fresh attempt; your messages stay with you.</> : 'Nine little worlds. More than one way through.'}</p>
          </div>
          <div className="journey-title-art"><TitleIllustration />
            <span className="journey-art-caption">POWERED BY STEAM.<br /><strong>REWRITTEN BY YOU.</strong></span></div>
        </section>}
      <footer className="journey-footer"><span>{storageAvailable ? 'Your journey is saved on this device.' : 'Browser storage is unavailable. Progress stays in this tab.'}</span>
        <span>★ {journeyStars(progress)} / {availableStars} <span className="journey-footer-extra">stars · All levels open</span></span></footer>
    </div>
    {settings && <FrontDoorSettings onClose={closeSettings} returnFocus={settingsTrigger.current} />}
  </main>;
}
