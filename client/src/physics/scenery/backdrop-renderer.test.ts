import { describe,expect,it,vi } from 'vitest';
import { drawPuzzleBackdrop } from '../scene-backdrop';
import { AmbientScenery } from '../ambient-scenery';
import { LivingWorld } from './living-world';

function canvas() {
  const methods=['save','restore','scale','rect','clip','beginPath','closePath','fillRect','fill','stroke','moveTo','lineTo',
    'arc','ellipse','bezierCurveTo','quadraticCurveTo','translate','rotate','roundRect','setLineDash'] as const;
  const gradient=()=>({addColorStop:vi.fn()});
  return {...Object.fromEntries(methods.map(name=>[name,vi.fn()])),createLinearGradient:vi.fn(gradient),createRadialGradient:vi.fn(gradient)} as unknown as CanvasRenderingContext2D;
}

describe('full-screen scenery painting',()=>{
  it.each(['cosmos','valley'] as const)('clips and balances %s painting without changing either simulation frame',theme=>{
    const living=new LivingWorld(theme),ambient=new AmbientScenery(800,510);
    living.advance(.05,{x:1,y:-1});ambient.advance(.05,{x:1,y:-1});
    const frame=living.snapshot(),birds=ambient.snapshot(),before=structuredClone({frame,birds});
    const ctx=canvas();drawPuzzleBackdrop(ctx,1366,768,frame,birds);
    expect(ctx.scale).toHaveBeenCalledWith(1.366,768/700);
    expect(ctx.rect).toHaveBeenCalledWith(0,0,1000,700);
    expect(ctx.clip).toHaveBeenCalled();
    expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
    expect({frame,birds}).toEqual(before);
  });

  it('has a static reduced-motion pose and safely ignores zero-size canvas resize',()=>{
    const frame=new LivingWorld('cosmos').snapshot(),ctx=canvas();
    drawPuzzleBackdrop(ctx,0,720,frame);expect(ctx.save).not.toHaveBeenCalled();
    drawPuzzleBackdrop(ctx,1280,720,frame,undefined,true);
    expect(ctx.fillRect).toHaveBeenCalled();expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
  });

  it('lets the HUD wash fade fully to transparent instead of leaving a horizontal seam',()=>{
    const ctx=canvas();drawPuzzleBackdrop(ctx,1280,720,new LivingWorld('cosmos').snapshot());
    const gradients=vi.mocked(ctx.createLinearGradient).mock.results;
    const hud=gradients.find((_,index)=>vi.mocked(ctx.createLinearGradient).mock.calls[index].join(',')==='0,0,0,230');
    expect(hud?.value.addColorStop).toHaveBeenLastCalledWith(1,'#f5f1e700');
  });
});
