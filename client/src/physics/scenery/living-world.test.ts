import { describe,expect,it } from 'vitest';
import { LivingWorld } from './living-world';
import { sceneryLayout, sceneryTheme } from './layout';
import { PhysicsWorld } from '../world';
import { bounce } from '../../levels/bounce';
import { gravityLab } from '../../levels/gravity-lab';
import { WATER_PARTICLE_COUNT } from './water-particles';

const down={x:0,y:1},up={x:0,y:-1};
function advance(scene:LivingWorld,seconds:number,vector=down,fps=60) {
  for(let i=0;i<seconds*fps;i++)scene.advance(1/fps,vector);
}

describe('independent living background',()=>{
  it('uses a stable visual theme from initial conditions, rather than changing themes with commands',()=>{
    expect(sceneryTheme(gravityLab)).toBe('cosmos');expect(sceneryTheme(bounce)).toBe('valley');
    const scene=new LivingWorld('cosmos');advance(scene,2,down);expect(scene.snapshot().theme).toBe('cosmos');
  });

  it('walks and drives along the distant road under ordinary downward acceleration',()=>{
    const scene=new LivingWorld('valley'),before=scene.snapshot();advance(scene,2);
    const after=scene.snapshot();
    expect(after.residents.filter(actor=>actor.kind==='walker')).toHaveLength(2);
    expect(after.residents.filter(actor=>actor.kind==='car')).toHaveLength(2);
    for(let i=0;i<after.residents.length;i++){
      const actor=after.residents[i];expect(actor.grounded).toBe(true);expect(actor.y).toBe(sceneryLayout.roadY);
      expect(actor.x).not.toBe(before.residents[i].x);expect(actor.phase).toBeGreaterThan(before.residents[i].phase);
    }
    expect(after.water).toHaveLength(WATER_PARTICLE_COUNT);expect(after.water.every(drop=>drop.vy>0)).toBe(true);
  });

  it('loses ground contact and turns the waterfall upward when acceleration reverses',()=>{
    const scene=new LivingWorld('valley');advance(scene,3,up);
    for(const actor of scene.snapshot().residents){expect(actor.grounded).toBe(false);expect(actor.y).toBeLessThan(sceneryLayout.roadY-60);expect(actor.vy).toBeLessThan(0);expect(actor.angle).not.toBe(0);}
    expect(scene.snapshot().water.every(drop=>drop.vy<0)).toBe(true);
  });

  it('preserves momentum with no acceleration and lands again after downward acceleration is restored',()=>{
    const scene=new LivingWorld('valley');advance(scene,2,up);const before=scene.snapshot();
    advance(scene,.5,{x:0,y:0});const coast=scene.snapshot();
    expect(coast.residents[0].y).toBeLessThan(before.residents[0].y);
    expect(coast.residents[0].grounded).toBe(false);
    advance(scene,6,down);expect(scene.snapshot().residents.every(actor=>actor.grounded)).toBe(true);
  });

  it('redirects falling water and makes cars slide when sideways force exceeds road traction',()=>{
    const left=new LivingWorld('valley'),right=new LivingWorld('valley');
    advance(left,3,{x:-10,y:1});advance(right,3,{x:10,y:1});
    expect(left.snapshot().water.every(drop=>drop.vx<0)).toBe(true);
    expect(right.snapshot().water.every(drop=>drop.vx>0)).toBe(true);
    expect(left.snapshot().residents[2].vx).toBeLessThan(right.snapshot().residents[2].vx);
    const light=new LivingWorld('valley'),heavy=new LivingWorld('valley');advance(light,.2);advance(heavy,.2,{x:0,y:20});
    expect(heavy.snapshot().water[0].vy).toBeGreaterThan(light.snapshot().water[0].vy);
  });

  it('uses the same fixed clock at 30 and 120 fps and bounds high acceleration extras',()=>{
    const a=new LivingWorld('valley'),b=new LivingWorld('valley');
    advance(a,7,{x:12,y:-8},30);advance(b,7,{x:12,y:-8},120);
    expect(a.snapshot()).toEqual(b.snapshot());
    advance(a,20,{x:100,y:-100});
    for(const actor of a.snapshot().residents){expect(Math.hypot(actor.vx,actor.vy)).toBeLessThanOrEqual(220.00001);expect(Number.isFinite(actor.x+actor.y+actor.angle)).toBe(true);}
  });

  it('freezes pause/reduced motion, caps hidden catchup, isolates snapshots and releases state',()=>{
    const a=new LivingWorld('valley'),b=new LivingWorld('valley');advance(a,1);advance(b,1);
    const before=a.snapshot();a.advance(100,up,false);a.advance(100,up,true,true);expect(a.snapshot()).toEqual(before);
    a.advance(100,down);b.advance(.05,down);expect(a.snapshot()).toEqual(b.snapshot());
    const external=a.snapshot();(external.residents[0] as {x:number}).x=9999;expect(a.snapshot()).toEqual(b.snapshot());
    for(const delta of [NaN,Infinity,-2,0])a.advance(delta,up);expect(a.snapshot()).toEqual(b.snapshot());
    a.dispose();a.advance(1,up);expect(a.snapshot()).toEqual({theme:'valley',time:0,residents:[],water:[],spray:[]});
    expect(new LivingWorld('valley').snapshot()).toEqual(new LivingWorld('valley').snapshot());
  });

  it('keeps zero-gravity astronauts and probes floating without a hidden floor',()=>{
    const scene=new LivingWorld('cosmos'),before=scene.snapshot();advance(scene,3,{x:0,y:0});const after=scene.snapshot();
    expect(after.water).toHaveLength(0);expect(after.residents.every(actor=>!actor.grounded)).toBe(true);
    expect(after.residents[0].x).not.toBe(before.residents[0].x);expect(after.residents[0].y).not.toBe(before.residents[0].y);
  });

  it('never changes the task trajectory, collision count, rules, star progress or clock',()=>{
    const plain=new PhysicsWorld(bounce),illustrated=new PhysicsWorld(bounce),background=new LivingWorld('valley');
    try {
      plain.start();illustrated.start();
      for(let tick=0;tick<700;tick++){
        const vector=tick<300?down:up;
        if(tick===300){plain.setGravity(-1);illustrated.setGravity(-1);}
        plain.step();illustrated.step();background.advance(1/120,Object.freeze({...vector}));
      }
      expect(illustrated.snapshot()).toEqual(plain.snapshot());
      expect(illustrated.ball.position).toEqual(plain.ball.position);
      expect(illustrated.engine.world.bodies).toHaveLength(plain.engine.world.bodies.length);
    } finally {plain.destroy();illustrated.destroy();background.dispose();}
  });
});
