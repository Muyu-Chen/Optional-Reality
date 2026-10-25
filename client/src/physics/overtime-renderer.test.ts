import { describe, expect, it, vi } from 'vitest';
import { PhysicsWorld } from './world';
import { gravityLab } from '../levels/gravity-lab';
import { drawOvertimeBoundary } from './overtime-renderer';

describe('visible rescue rim',()=>{
  it('uses the same expanded collision edges and freezes its fade with simulation time',()=>{
    const world=new PhysicsWorld(gravityLab);
    const ctx={save:vi.fn(),restore:vi.fn(),strokeRect:vi.fn(),setLineDash:vi.fn(),globalAlpha:1};
    const draw=(reduced=false)=>drawOvertimeBoundary(ctx as unknown as CanvasRenderingContext2D,world,reduced);
    try {
      draw();expect(ctx.strokeRect).not.toHaveBeenCalled();
      world.tick=world.limitTicks-1;world.start();world.step();draw();
      expect(ctx.strokeRect.mock.calls).toEqual([[3,-99,954,606],[5,-97,950,602]]);
      expect(ctx.globalAlpha).toBeCloseTo(1/60);
      world.pause();world.step();draw();expect(ctx.globalAlpha).toBeCloseTo(1/60);
      draw(true);expect(ctx.globalAlpha).toBe(1);
      world.tick+=59;draw();expect(ctx.globalAlpha).toBe(1);
      expect(ctx.save.mock.calls.length).toBe(ctx.restore.mock.calls.length);
    }finally{world.destroy();}
  });
});
