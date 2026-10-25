import type { LevelDefinition } from './types';

export const hookTurn: LevelDefinition = {
  id: 'hook-turn', number: 1, stage: 8, title: 'Hook Turn',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 0], environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [130, 330], velocity: [2, 0], radius: 16, restitution: 0 },
  tracks: [], guideLines: [],
  stars: [{ id: 'outbound', position: [350, 330], radius: 18 }, { id: 'turn', position: [600, 330], radius: 22 }, { id: 'curve-home', position: [430, 258], radius: 26 }],
  exit: { id: 'exit', label: 'HOME ABOVE', x: 70, y: 85, width: 120, height: 130 },
  instructions: {
    objective: 'Visit the far star, then curve back to the high exit.',
    hint: 'Press Start. After the first star, near x450, send leftward acceleration 1. The ball still travels right before turning. At the far star, as it starts moving left, add upward acceleration 0.4. The leftward pull stays active, so the return path curves toward the high exit.',
    sceneDescription: 'A protected ball drifts right at 2 m/s through a lower star row. Its exit is above and behind the start. Leftward acceleration brakes and reverses the drift; adding upward acceleration around the far turning point preserves the leftward component and draws a hook-shaped return path. Three stars require an outward journey and an elevated return. No collision surfaces or devices. All environment rules are editable and edges open.',
    canvasHeading: 'A RETURN JOURNEY WITH A TWIST.', readyCaption: 'TURN LEFT. THEN ADD LIFT.',
    exampleMessages: ['acceleration leftward 1', 'acceleration upward 0.4'],
    suggestedMessages: ['acceleration leftward 1', 'acceleration upward 0.4'],
    exampleNotice: 'Start the drift without sending. Brake near x450, then add lift when the rightward motion turns back near the far star.',
  },
};
