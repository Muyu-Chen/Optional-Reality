import { describe,expect,it } from 'vitest';
import { WaterParticles,WATER_PARTICLE_COUNT } from './water-particles';
import { sceneryLayout } from './layout';

function advance(emitter:WaterParticles,seconds:number,ax=0,ay=1) {
  for(let i=0;i<seconds*120;i++)emitter.step(ax,ay,1/120);
}

describe('bounded decorative water emitter',()=>{
  it('maintains a densely populated column rather than isolated long marks',()=>{
    const emitter=new WaterParticles();advance(emitter,6);
    const {water,spray}=emitter.snapshot(),{y,poolY}=sceneryLayout.waterfall;
    expect(water).toHaveLength(WATER_PARTICLE_COUNT);
    for(let band=0;band<8;band++){
      const top=y+(poolY-y)*band/8,bottom=y+(poolY-y)*(band+1)/8;
      expect(water.filter(drop=>drop.y>=top&&drop.y<bottom).length).toBeGreaterThan(20);
    }
    expect(water.every(drop=>drop.radius>=.7&&drop.radius<1.7&&drop.y<=poolY)).toBe(true);
    expect(spray.length).toBeGreaterThan(0);expect(spray.length).toBeLessThanOrEqual(24);
  });

  it('accelerates existing particles gradually on reversal and redirects newly emitted water',()=>{
    const emitter=new WaterParticles();advance(emitter,.1);const before=emitter.snapshot().water[0];
    emitter.step(0,-1,1/120);const next=emitter.snapshot().water[0];
    expect(next.age).toBeGreaterThan(before.age);expect(next.vy).toBeCloseTo(before.vy-.25,9);
    expect(Math.abs(next.y-before.y)).toBeLessThan(1);
    advance(emitter,3,0,-1);expect(emitter.snapshot().water.every(drop=>drop.vy<0)).toBe(true);
  });

  it('preserves the emitted velocity with acceleration off, including diagonal momentum',()=>{
    const emitter=new WaterParticles();emitter.step(4,-2,1/120);const before=emitter.snapshot().water[0];
    emitter.step(0,0,1/120);const after=emitter.snapshot().water[0];
    expect(after.vx).toBe(before.vx);expect(after.vy).toBe(before.vy);
    expect(after.x-before.x).toBeCloseTo(before.vx/120,9);expect(after.y-before.y).toBeCloseTo(before.vy/120,9);
  });

  it('keeps spray short-lived and bounded, with no pool splashes when the stream misses the pool',()=>{
    const emitter=new WaterParticles();advance(emitter,2);expect(emitter.snapshot().spray.length).toBeGreaterThan(0);
    advance(emitter,4,8,-5);
    expect(emitter.snapshot().spray).toHaveLength(0);
    advance(emitter,30,100,100);const frame=emitter.snapshot();
    expect(frame.water).toHaveLength(WATER_PARTICLE_COUNT);expect(frame.spray.length).toBeLessThanOrEqual(24);
    expect(frame.water.every(drop=>Number.isFinite(drop.x+drop.y+drop.vx+drop.vy))).toBe(true);
    expect(frame.spray.every(drop=>drop.age<drop.life&&drop.life<=.48)).toBe(true);
  });

  it('is deterministic, isolates snapshots, and disposes the emitter and all spray',()=>{
    const a=new WaterParticles(),b=new WaterParticles();advance(a,5,1,-1);advance(b,5,1,-1);
    expect(a.snapshot()).toEqual(b.snapshot());const external=a.snapshot();external.water[0].x=-999;
    expect(a.snapshot()).toEqual(b.snapshot());a.dispose();a.step(0,1,1/120);
    expect(a.snapshot()).toEqual({water:[],spray:[]});expect(new WaterParticles().snapshot()).toEqual(new WaterParticles().snapshot());
  });

  it('ignores invalid intervals and caps catchup to one owner-clock tick',()=>{
    const a=new WaterParticles(),b=new WaterParticles(),before=a.snapshot();
    for(const delta of [NaN,Infinity,-1,0])a.step(0,1,delta);expect(a.snapshot()).toEqual(before);
    a.step(NaN,Infinity,100);b.step(0,0,1/120);expect(a.snapshot()).toEqual(b.snapshot());
  });
});
