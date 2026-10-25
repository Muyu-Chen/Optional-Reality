import { MusicProvider } from './audio/MusicProvider';
import { SoundEffectsProvider } from './audio/SoundEffectsProvider';
import { Game } from './game/Game';
import { findLevel } from './levels/catalog';
import { useJourney } from './game/useJourney';
import { FrontDoor } from './components/front-door/FrontDoor';

export default function App() {
  const journey = useJourney();
  const level = journey.route.view === 'game' ? findLevel(journey.route.levelId) : undefined;
  return <MusicProvider><SoundEffectsProvider>
    {level ? <Game key={`${level.id}:${journey.visit}`} level={level} chooseLevel={journey.chooseLevel}
      onTitle={journey.showTitle} onLevelSelect={journey.showLevels} onCompleted={journey.recordCompletion} />
      : <FrontDoor view={journey.route.view === 'levels' ? 'levels' : 'title'} progress={journey.progress}
        storageAvailable={journey.storageAvailable} onPlay={journey.chooseLevel}
        onTitle={journey.showTitle} onLevelSelect={journey.showLevels} />}
  </SoundEffectsProvider></MusicProvider>;
}
