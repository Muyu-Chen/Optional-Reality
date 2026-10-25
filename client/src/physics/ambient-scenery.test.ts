import { describe,expect,it,vi } from 'vitest';
import { AmbientScenery,type AmbientFrame } from './ambient-scenery';
import { drawAmbientScenery } from './ambient-scenery-renderer';
import { PhysicsWorld } from './world';
import { gravityLab } from '../levels/gravity-lab';

const down={x:0,y:9.8},up={x:0,y:-9.8};
function advance(scene:AmbientScenery,seconds:number,acceleration=down,fps=60) {
  for(let i=0;i<Math.round(seconds*fps);i++)scene.advance(1/fps,acceleration);
}
function canvas() {
  const methods=['save','restore','beginPath','closePath','rect','clip','ellipse','fill','translate','rotate','moveTo','quadraticCurveTo','lineTo','stroke'] as const;
  return Object.fromEntries(methods.map(name=>[name,vi.fn()])) as unknown as CanvasRenderingContext2D;
}

describe('distant ambient ecosystem',()=>{
  it('starts with a deterministic, capped flock and three clouds at either viewport size',()=>{
    for(const [width,height] of [[800,510],[960,540]]) {
      const scene=new AmbientScenery(width,height),frame=scene.snapshot();
      expect(frame).toEqual(new AmbientScenery(width,height).snapshot());
      expect(frame.birds.filter(bird=>bird.kind==='bird')).toHaveLength(5);
      expect(frame.birds.filter(bird=>bird.kind==='eagle')).toHaveLength(1);
      expect(frame.clouds).toHaveLength(3);
      for(const bird of frame.birds) {
        expect(bird.x).toBeGreaterThan(0);expect(bird.x).toBeLessThan(width);
        expect(bird.y).toBeGreaterThan(0);expect(bird.y).toBeLessThan(height*.4);
      }
    }
  });

  it('uses one motion clock regardless of rendered frame rate',()=>{
    const low=new AmbientScenery(800,510),high=new AmbientScenery(800,510);
    advance(low,8,down,30);advance(high,8,down,120);
    const a=low.snapshot(),b=high.snapshot();
    expect(a.time).toBeCloseTo(8,9);expect(a.time).toBeCloseTo(b.time,9);
    for(let i=0;i<a.birds.length;i++) {
      expect(a.birds[i].x).toBeCloseTo(b.birds[i].x,9);
      expect(a.birds[i].y).toBeCloseTo(b.birds[i].y,9);
      expect(a.birds[i].wingPhase).toBeCloseTo(b.birds[i].wingPhase,9);
    }
    expect(a.clouds).toEqual(b.clouds);
  });

  it('turns lift and velocity gradually after gravity reverses, then continues flying upside down',()=>{
    const scene=new AmbientScenery(800,510);
    advance(scene,3);const before=scene.snapshot();
    scene.advance(1/60,up);const next=scene.snapshot();
    for(let i=0;i<before.birds.length;i++) {
      const a=before.birds[i],b=next.birds[i];
      expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(1);
      expect(Math.abs(b.liftAngle-a.liftAngle)).toBeLessThan(.03);
      expect(Math.hypot(b.vx-a.vx,b.vy-a.vy)).toBeLessThan(1);
    }
    advance(scene,4,up);const reversed=scene.snapshot();
    expect(reversed.birds[0].liftAngle).toBeCloseTo(Math.PI/2,6);
    expect(Math.hypot(reversed.birds[0].x-before.birds[0].x,reversed.birds[0].y-before.birds[0].y)).toBeGreaterThan(15);
    expect(reversed.birds[0].wingPhase).toBeGreaterThan(before.birds[0].wingPhase);
  });

  it('responds to horizontal and diagonal acceleration without losing finite bounded flight',()=>{
    const scene=new AmbientScenery(800,510);
    advance(scene,5,{x:40,y:0});
    expect(scene.snapshot().birds[0].liftAngle).toBeCloseTo(-Math.PI,6);
    advance(scene,5,{x:-40,y:40});
    const frame=scene.snapshot();
    const lift=frame.birds[0].liftAngle;
    expect(Math.cos(lift)).toBeCloseTo(Math.SQRT1_2,6);
    expect(Math.sin(lift)).toBeCloseTo(-Math.SQRT1_2,6);
    for(const bird of frame.birds) {
      expect(Number.isFinite(bird.x)&&Number.isFinite(bird.y)).toBe(true);
      expect(Math.hypot(bird.vx,bird.vy)).toBeLessThan(36);
      expect(bird.x).toBeGreaterThan(0);expect(bird.x).toBeLessThan(800);
      expect(bird.y).toBeGreaterThan(0);expect(bird.y).toBeLessThan(510*.5);
    }
  });

  it('preserves its flight frame at zero gravity while independent flock and eagle cycles continue',()=>{
    const scene=new AmbientScenery(800,510);
    advance(scene,4,up);const before=scene.snapshot();
    advance(scene,1,{x:0,y:0});const after=scene.snapshot();
    expect(after.birds[0].liftAngle).toBe(before.birds[0].liftAngle);
    const little=after.birds[0].wingPhase-before.birds[0].wingPhase;
    const eagle=after.birds[5].wingPhase-before.birds[5].wingPhase;
    expect(little).toBeGreaterThan(eagle*5);
    expect(after.birds[0].x).not.toBe(before.birds[0].x);
  });

  it('lets clouds drift and gently redirect with the environment vector',()=>{
    const left=new AmbientScenery(800,510),right=new AmbientScenery(800,510);
    advance(left,8,{x:-40,y:-20});advance(right,8,{x:40,y:20});
    const a=left.snapshot().clouds[0],b=right.snapshot().clouds[0];
    expect(a.vx).toBeLessThan(0);expect(b.vx).toBeGreaterThan(0);
    expect(a.y).toBeLessThan(b.y);
    expect(a.x).toBeLessThan(b.x);
  });

  it('freezes pause/background and reduced-motion, and never catches up a hidden interval',()=>{
    const scene=new AmbientScenery(800,510);advance(scene,.5);
    const before=scene.snapshot();
    scene.advance(300,up,false);expect(scene.snapshot()).toEqual(before);
    scene.advance(1,up,true,true);expect(scene.snapshot()).toEqual(before);
    const fresh=new AmbientScenery(800,510);advance(fresh,.5);
    scene.advance(300,down);fresh.advance(.05,down);
    expect(scene.snapshot()).toEqual(fresh.snapshot());
    for(const delta of [NaN,Infinity,0,-1])scene.advance(delta,up);
    expect(scene.snapshot()).toEqual(fresh.snapshot());
  });

  it('does not change Matter bodies, rules, stars or simulation time',()=>{
    const world=new PhysicsWorld(gravityLab),scene=new AmbientScenery(800,510);
    try {
      const before=world.snapshot(),bodyCount=world.engine.world.bodies.length;
      const acceleration=Object.freeze({...world.rules.acceleration});
      advance(scene,10,acceleration);
      expect(world.snapshot()).toEqual(before);
      expect(world.engine.world.bodies).toHaveLength(bodyCount);
      expect(acceleration).toEqual(world.rules.acceleration);
    } finally {world.destroy();}
  });

  it('releases its small state on dispose and a retry gets the exact initial scene',()=>{
    const initial=new AmbientScenery(800,510).snapshot(),scene=new AmbientScenery(800,510);
    const external=scene.snapshot();(external.birds[0] as {x:number}).x=-999;
    expect(scene.snapshot()).toEqual(initial);
    advance(scene,5);scene.dispose();scene.advance(1,down);
    expect(scene.snapshot()).toMatchObject({time:0,birds:[],clouds:[]});
    expect(new AmbientScenery(800,510).snapshot()).toEqual(initial);
  });

  it('clips window scenery and leaves the frame untouched when painting',()=>{
    const frame=new AmbientScenery(800,510).snapshot(),before=structuredClone(frame),ctx=canvas();
    drawAmbientScenery(ctx,frame,false,{x:53,y:153,width:222,height:151,detailScale:.65});
    expect(ctx.rect).toHaveBeenCalledWith(53,153,222,151);
    expect(ctx.save).toHaveBeenCalledTimes(7);expect(ctx.restore).toHaveBeenCalledTimes(7);
    expect(frame).toEqual(before);
  });

  it('paints a static wing pose under reduced motion even if a prior animated phase differs',()=>{
    const frame=new AmbientScenery(800,510).snapshot(),later:AmbientFrame={...frame,birds:frame.birds.map(bird=>({...bird,wingPhase:bird.wingPhase+Math.PI/2}))};
    const a=canvas(),b=canvas(),c=canvas();
    drawAmbientScenery(a,frame,true);drawAmbientScenery(b,later,true);drawAmbientScenery(c,later,false);
    expect(vi.mocked(a.quadraticCurveTo).mock.calls).toEqual(vi.mocked(b.quadraticCurveTo).mock.calls);
    expect(vi.mocked(c.quadraticCurveTo).mock.calls).not.toEqual(vi.mocked(b.quadraticCurveTo).mock.calls);
  });
});
