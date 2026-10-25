import { describe,expect,it,vi } from 'vitest';
import { LivingWorld } from './living-world';
import { sceneryLayout } from './layout';
import { drawWaterfall, waterfallCentreline } from './waterfall-renderer';

function advance(world:LivingWorld,seconds:number,vector={x:0,y:1}) {
  for(let i=0;i<seconds*120;i++)world.advance(1/120,vector);
}
function canvas() {
  return Object.fromEntries(['save','restore','beginPath','moveTo','lineTo','quadraticCurveTo','ellipse','stroke']
    .map(method=>[method,vi.fn()])) as unknown as CanvasRenderingContext2D;
}

describe('simple continuous waterfall',()=>{
  it('connects the river mouth to the pool without ending in a cloud of separate drops',()=>{
    const world=new LivingWorld('valley');advance(world,4);const frame=world.snapshot();
    const before=structuredClone(frame),points=waterfallCentreline(frame.water),ctx=canvas();
    expect(points[0]).toEqual({x:sceneryLayout.waterfall.x+sceneryLayout.waterfall.width/2,y:sceneryLayout.waterfall.y});
    expect(points[points.length-1].y).toBe(sceneryLayout.waterfall.poolY);
    expect(points.every(point=>Number.isFinite(point.x+point.y))).toBe(true);
    drawWaterfall(ctx,frame);
    expect(ctx.stroke).toHaveBeenCalledTimes(8); // 3 ribbons, 3 white ripples, 2 modest splash shapes.
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(frame).toEqual(before);
  });

  it('keeps existing flow continuous during reversal, then bends upward rather than teleporting it',()=>{
    const world=new LivingWorld('valley');
    const before=waterfallCentreline(world.snapshot().water);world.advance(1/60,{x:0,y:-1});
    const after=waterfallCentreline(world.snapshot().water);
    for(let i=0;i<before.length-1;i++)expect(Math.hypot(after[i].x-before[i].x,after[i].y-before[i].y)).toBeLessThan(3);
    advance(world,3,{x:0,y:-1});const reversed=waterfallCentreline(world.snapshot().water);
    expect(reversed[reversed.length-1].y).toBeLessThan(sceneryLayout.waterfall.y);
    const ctx=canvas();drawWaterfall(ctx,world.snapshot());expect(ctx.ellipse).not.toHaveBeenCalled();
  });

  it('bends sideways with the parcel momentum, remains deterministic, and ignores an absent stream',()=>{
    const world=new LivingWorld('valley');advance(world,3,{x:5,y:1});
    const points=waterfallCentreline(world.snapshot().water);
    expect(points[points.length-1].x).toBeGreaterThan(points[0].x+80);
    expect(waterfallCentreline(world.snapshot().water)).toEqual(points);
    const ctx=canvas();drawWaterfall(ctx,new LivingWorld('cosmos').snapshot());expect(ctx.stroke).not.toHaveBeenCalled();
  });
});
