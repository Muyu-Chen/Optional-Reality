import { describe, expect, it } from 'vitest';
import { levels } from '../levels/catalog';
import { bounce } from '../levels/bounce';
import { multiBounce } from '../levels/multi-bounce';
import { oneMoreTurn } from '../levels/one-more-turn';
import { prepareMessage, messageOperations } from '../domain/queue';
import { ruleContext } from '../levels/rules';
import { PhysicsWorld } from './world';

function apply(world:PhysicsWorld,text:string) {
  const message=prepareMessage(text,text,ruleContext(world.level),world.rules);
  expect(message.status,text).toBe('ready');
  world.applyMessages([{text,operations:messageOperations(message)}]);
}
function play(world:PhysicsWorld,update:(world:PhysicsWorld)=>void=()=>{}) {
  world.start();
  for(let i=0;i<world.limitTicks && !world.won && !world.timedOut;i++) {
    if(world.tutorialId)world.continueTutorial();
    update(world);world.step();
  }
}
describe('ordinary and full-score routes',()=>{
  it.each(levels)('$id has at least three valid stars and a reproducible full-score route',level=>{
    const world=new PhysicsWorld(level);let sent=false;
    try{
      expect(world.stars.total).toBeGreaterThanOrEqual(3);
      if(level.id==='gravity-lab' || level.id==='one-more-turn')apply(world,'add gravity');
      else if(level.id==='bounce')apply(world,'Set surface bounce to 0');
      else if(level.id==='multi-bounce')apply(world,'Set surface bounce to 0.9');
      else if(level.id==='friction-runway')apply(world,'Set surface friction to 0');
      else for(const text of level.instructions.exampleMessages)apply(world,text);
      play(world,w=>{
        if(sent)return;
        const text=level.id==='gravity-lab'&&w.ball.position.x>=600 ? 'stop gravity'
          : level.id==='bounce'&&w.ball.position.x>=490 ? 'acceleration upward 2'
          : level.id==='multi-bounce'&&w.tick>=480 ? 'gravity downward 4'
          : level.id==='friction-runway'&&w.ball.position.x>=580 ? 'surface friction 0.3'
          : level.id==='one-more-turn'&&w.devices.firedSprings.size&&w.ball.velocity.y>0&&w.ball.position.y>=330 ? 'reverse gravity' : '';
        if(text){apply(w,text);sent=true;}
      });
      expect(world.won,JSON.stringify(world.snapshot())).toBe(true);
      expect(world.stars.fullScore,JSON.stringify([...world.stars.collected])).toBe(true);
    }finally{world.destroy();}
  });
  it.each([400,440,480,520,560,600])('keeps a wide full-score window for high bounce then downward acceleration at tick %s',tick=>{
    const world=new PhysicsWorld(multiBounce);let sent=false;
    try{
      apply(world,'surface bounce 0.9');
      play(world,w=>{if(!sent&&w.tick>=tick){apply(w,'gravity downward 4');sent=true;}});
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(true);
    }finally{world.destroy();}
  });
  it.each([[440,1.5],[470,2],[490,2],[510,2],[530,3]])('permits low bounce then upward acceleration with x=%s and magnitude=%s', (x,magnitude)=>{
    const world=new PhysicsWorld(bounce);let sent=false;
    try{
      apply(world,'surface bounce 0');
      play(world,w=>{if(!sent&&w.ball.position.x>=x){apply(w,`acceleration upward ${magnitude}`);sent=true;}});
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(true);
    }finally{world.destroy();}
  });
  it('keeps the previous bounce route as ordinary completion without granting full score',()=>{
    const world=new PhysicsWorld(multiBounce);let sent=false;
    try{
      apply(world,'surface bounce 0.9');
      play(world,w=>{if(!sent&&w.tick>=480){apply(w,'surface bounce 0.5');sent=true;}});
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(false);
    }finally{world.destroy();}
  });
  it.each([315,330,345,360,380])('allows reversing after the spring at returning height %s',height=>{
    const world=new PhysicsWorld(oneMoreTurn);let sent=false;
    try{
      apply(world,'add gravity');
      play(world,w=>{if(!sent&&w.devices.firedSprings.size&&w.ball.velocity.y>0&&w.ball.position.y>=height){apply(w,'reverse gravity');sent=true;}});
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(true);
    }finally{world.destroy();}
  });
  it('does not grant the spring level full score when flying straight to the exit',()=>{
    const world=new PhysicsWorld(oneMoreTurn);
    try{apply(world,'acceleration upward 1');play(world);expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(false);}
    finally{world.destroy();}
  });
});
