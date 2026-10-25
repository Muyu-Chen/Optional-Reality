export interface OnboardingStep {
  title: string;
  body: string;
  diagram: 'queue' | 'ramp' | 'coast' | 'fall' | 'spring' | 'reverse';
}
export interface LevelOnboarding {
  title: string;
  steps: readonly OnboardingStep[];
}

const lessons: Readonly<Record<string, LevelOnboarding>> = {
  'gravity-lab': {
    title: 'Queue the rules. Choose the moment.',
    steps: [
      { title: 'Prepare both messages', diagram: 'queue',
        body: 'Type “add gravity” and “stop gravity”. Press Enter after each. Both messages wait in the queue; nothing moves yet.' },
      { title: 'Send the first rule', diagram: 'ramp',
        body: 'Click Send now beside “add gravity”. The ball rolls down the track. Your second message stays ready.' },
      { title: 'Switch gravity off at the edge', diagram: 'coast',
        body: 'As the ball leaves the track, send “stop gravity”. It keeps its momentum and travels toward the exit.' },
    ],
  },
  'one-more-turn': {
    title: 'Fall. Rebound. Change direction.',
    steps: [
      { title: 'Fall through the low star', diagram: 'fall',
        body: 'The ball starts floating with no gravity. Queue “add gravity”, then click Send now to fall through the lower star.' },
      { title: 'Let the spring rebound', diagram: 'spring',
        body: 'The passive spring compresses on contact and rebounds naturally. By itself, it cannot lift the ball above its starting height.' },
      { title: 'Reverse gravity for more height', diagram: 'reverse',
        body: 'Send “reverse gravity” to turn the acceleration upward. Reach the two higher stars, then the exit.' },
    ],
  },
};

export const onboardingFor = (levelId: string): LevelOnboarding | undefined => lessons[levelId];
export const onboardingStorageKey = (levelId: string) => `optional-reality:${levelId}:how-to-play:v1`;
