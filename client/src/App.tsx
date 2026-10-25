import { useMobileIntro } from './game/useMobileIntro';
import { MusicProvider } from './audio/MusicProvider';
import { SoundEffectsProvider } from './audio/SoundEffectsProvider';
import { Game } from './game/Game';
import { findLevel } from './levels/catalog';
import { useJourney } from './game/useJourney';
import { FrontDoor } from './components/front-door/FrontDoor';
import { SteamKissExperiment } from './game/SteamKissExperiment';

export default function App() {
  const journey = useJourney();
  const mobile = useMobileIntro();
  const level = !mobile && journey.route.view === 'game' ? findLevel(journey.route.levelId) : undefined;
  const steamExperiment = level?.id === 'reality-breakdown' && new URLSearchParams(window.location.search).get('experiment') === 'steam-kiss';
  if (steamExperiment) return <SteamKissExperiment key={journey.visit} onBack={journey.showLevels} />;
  return <MusicProvider><SoundEffectsProvider>
    {level ? <Game key={`${level.id}:${journey.visit}`} level={level} chooseLevel={journey.chooseLevel}
      onTitle={journey.showTitle} onLevelSelect={journey.showLevels} onCompleted={journey.recordCompletion} />
      : <FrontDoor mobile={mobile} view={!mobile && journey.route.view === 'levels' ? 'levels' : 'title'} progress={journey.progress}
        storageAvailable={journey.storageAvailable} onPlay={journey.chooseLevel}
        onTitle={journey.showTitle} onLevelSelect={journey.showLevels} />}
  </SoundEffectsProvider></MusicProvider>;
}
