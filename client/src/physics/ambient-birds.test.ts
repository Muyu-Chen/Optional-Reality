import {describe,expect,it,vi} from 'vitest';
import {AmbientScenery,type AmbientBird} from './ambient-scenery';
import {ambientBirdPose,drawAmbientBird} from './ambient-bird-renderer';

function advance(scene:AmbientScenery,seconds:number,acceleration={x:0,y:9.8}) {
  for(let i=0;i<Math.round(seconds*120);i++)scene.advance(1/120,acceleration);
}
const seeded=(kind:AmbientBird['kind'])=>new AmbientScenery(800,510).snapshot().birds.find(bird=>bird.kind===kind)!;

describe('bird silhouettes and flight presentation',()=>{
  it('makes small birds 1.6 times and the eagle 1.8 times their previous visible span',()=>{
    expect(ambientBirdPose(seeded('bird')).span/4.2).toBeCloseTo(1.6,10);
    expect(ambientBirdPose(seeded('eagle')).span/8).toBeCloseTo(1.8,10);
  });

  it('uses frequent small-bird strokes but keeps the eagle gliding for most of each cycle',()=>{
    const small=seeded('bird'),eagle=seeded('eagle');
    const poses=Array.from({length:720},(_,i)=>i/720*Math.PI*2).map(phase=>({
      small:ambientBirdPose({...small,wingPhase:phase}).flap,
      eagle:ambientBirdPose({...eagle,wingPhase:phase}).flap,
    }));
    expect(Math.max(...poses.map(p=>p.small))).toBeGreaterThan(.65);
    expect(poses.filter(p=>Math.abs(p.eagle)<.025).length/poses.length).toBeGreaterThan(.75);
    expect(poses.some(p=>p.eagle>.15)&&poses.some(p=>p.eagle<-.15)).toBe(true);
    const scene=new AmbientScenery(800,510);advance(scene,1);
    const birds=scene.snapshot().birds;
    expect(birds[0].wingPhase-small.wingPhase).toBeGreaterThan((birds[5].wingPhase-eagle.wingPhase)*8);
  });

  it.each([{x:9.8,y:0},{x:-9.8,y:9.8},{x:0,y:-9.8}])('visibly banks into changed acceleration %j without an abrupt flip',acceleration=>{
    const scene=new AmbientScenery(800,510);advance(scene,2);
    const before=scene.snapshot().birds[0],first=ambientBirdPose(before);
    scene.advance(1/120,acceleration);
    const immediately=ambientBirdPose(scene.snapshot().birds[0]);
    expect(Math.abs(immediately.bank-first.bank)).toBeLessThan(.04);
    advance(scene,1,acceleration);
    const turned=ambientBirdPose(scene.snapshot().birds[0]);
    expect(Math.abs(turned.bank-first.bank)).toBeGreaterThan(.5);
    advance(scene,5,acceleration);
    const settled=scene.snapshot().birds[0],strength=Math.hypot(acceleration.x,acceleration.y);
    expect(Math.cos(settled.liftAngle)).toBeCloseTo(-acceleration.x/strength,6);
    expect(Math.sin(settled.liftAngle)).toBeCloseTo(-acceleration.y/strength,6);
  });

  it('switches to gentle coasting at zero acceleration without resetting the flight direction or stopping movement',()=>{
    const scene=new AmbientScenery(800,510);advance(scene,2);
    const before=scene.snapshot().birds[0];advance(scene,3,{x:0,y:0});
    const after=scene.snapshot().birds[0];
    expect(after.liftAngle).toBe(before.liftAngle);
    expect(after.effort).toBeLessThan(.02);
    expect(ambientBirdPose({...after,wingPhase:Math.PI/2}).flap).toBeLessThan(.2);
    expect(after.wingPhase-before.wingPhase).toBeLessThan(3*12*.8);
    expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(1);
  });

  it('keeps the larger flock bounded through repeated strong, diagonal and zero acceleration changes',()=>{
    const scene=new AmbientScenery(800,510);
    const vectors=[{x:100,y:0},{x:0,y:-100},{x:-100,y:-100},{x:0,y:0},{x:-100,y:100},{x:100,y:100}];
    for(let round=0;round<3;round++)for(const vector of vectors) {
      advance(scene,8,vector);
      for(const bird of scene.snapshot().birds) {
        expect(bird.x).toBeGreaterThan(20);expect(bird.x).toBeLessThan(780);
        expect(bird.y).toBeGreaterThan(0);expect(bird.y).toBeLessThan(255);
        expect(bird.effort).toBeGreaterThanOrEqual(0);expect(bird.effort).toBeLessThanOrEqual(1);
        expect(Math.hypot(bird.vx,bird.vy)).toBeLessThan(36);
      }
    }
  });

  it('draws a recognisable filled body and head without changing the bird, and freezes every wing under reduced motion',()=>{
    const bird=seeded('eagle'),before=structuredClone(bird);
    const methods=['save','restore','translate','rotate','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','ellipse','fill','stroke'] as const;
    const ctx=Object.fromEntries(methods.map(method=>[method,vi.fn()])) as unknown as CanvasRenderingContext2D;
    drawAmbientBird(ctx,bird,25,30,.65,true);
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
    expect(ctx.fill).toHaveBeenCalled();expect(ctx.save).toHaveBeenCalledTimes(1);expect(ctx.restore).toHaveBeenCalledTimes(1);
    expect(bird).toEqual(before);
    for(const kind of ['bird','eagle'] as const)for(const phase of [0,.3,2,6])expect(ambientBirdPose({...seeded(kind),wingPhase:phase},true).flap).toBe(0);
  });
});
