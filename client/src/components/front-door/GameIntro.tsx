import { IntroDiagram } from './IntroDiagram';

/** Shared product introduction, separate from the playable HUD and tutorials. */
export function GameIntro() {
  return <section className="journey-intro" aria-labelledby="game-intro-title">
    <span className="journey-eyebrow">A LITTLE INTRODUCTION</span>
    <h2 id="game-intro-title">You don’t move the ball.<br />You change its world.</h2>
    <p>A natural-language physics puzzle. Change acceleration, bounce and friction, then choose the exact moment your rule takes effect.</p>
    <ol>
      <li><IntroDiagram step="write" /><b>01 · Write a rule</b><span>Try “add gravity”. Your message waits in the queue.</span></li>
      <li><IntroDiagram step="time" /><b>02 · Choose the moment</b><span>Press Send now to change the world. Timing makes the difference.</span></li>
      <li><IntroDiagram step="collect" /><b>03 · Find your way</b><span>Reach the exit. Collect all three stars for full score, or retry a different route.</span></li>
    </ol>
  </section>;
}
