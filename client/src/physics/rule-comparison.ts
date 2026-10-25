import type { PhysicsWorld } from './world';
import { STEP_MS } from './world';
import type { Point } from '../levels/types';

export interface RuleComparisonView { reference:Point[]; actual:Point[]; opacity:number }
const position = (world:PhysicsWorld):Point => [world.ball.position.x,world.ball.position.y];

/** A short counterfactual from the old rules, compared with observed live movement. */
export class RuleComparison {
  private observedRevision=0;
  private shownReversal=false;
  private born=0;
  private reference:Point[]=[];
  private actual:Point[]=[];
  private lastTick=-1;

  captureRule(world:PhysicsWorld, reducedMotion=false) {
    const change=world.lastRuleChange;
    if(!change) { this.clear();return; }
    if(change.revision===this.observedRevision)return;
    this.observedRevision=change.revision;
    this.reference=[];this.actual=[];
    const before=change.before.acceleration,after=change.after.acceleration;
    if(reducedMotion || this.shownReversal || !(before.x*after.x<0 || before.y*after.y<0))return;
    const branch=world.forkBeforeLastRuleChange();
    if(!branch)return;
    try {
      this.reference=[position(branch)];
      branch.start();
      const steps=Math.round(1200/STEP_MS);
      for(let i=0;i<steps && branch.running;i++) {
        branch.step();
        if(i%6===5 || !branch.running)this.reference.push(position(branch));
      }
      // A zero-motion reference still conveys a real consequence, but needs two samples.
      if(this.reference.length<2) { this.reference=[];return; }
      this.shownReversal=true;this.born=world.tick;this.lastTick=world.tick;
      this.actual=[position(world)];
    } finally { branch.destroy(); }
  }
  captureStep(world:PhysicsWorld) {
    if(!this.reference.length || world.tick===this.lastTick)return;
    this.lastTick=world.tick;
    if(world.tick-this.born>240) { this.reference=[];this.actual=[];return; }
    if((world.tick-this.born)%6===0)this.actual.push(position(world));
  }
  get view():RuleComparisonView {
    return {reference:this.reference,actual:this.actual,opacity:Math.max(0,Math.min(1,(240-(this.lastTick-this.born))/72))};
  }
  clear() { this.reference=[];this.actual=[]; }
}
