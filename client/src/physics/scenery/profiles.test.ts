import { describe,expect,it,vi } from 'vitest';
import { levels } from '../../levels/catalog';
import { sceneryProfile,sceneryProfiles } from './profiles';
import { sceneryTheme } from './layout';
import { LivingWorld } from './living-world';
import { drawPuzzleBackdrop } from '../scene-backdrop';
import { drawBakeryRoom } from '../bakery/room';

function canvas() {
  const methods=['save','restore','scale','rect','clip','beginPath','closePath','fillRect','fill','stroke','moveTo','lineTo',
    'arc','ellipse','bezierCurveTo','quadraticCurveTo','translate','rotate','roundRect','setLineDash','fillText'] as const;
  const gradient=()=>({addColorStop:vi.fn()});
  return {...Object.fromEntries(methods.map(name=>[name,vi.fn()])),createLinearGradient:vi.fn(gradient),createRadialGradient:vi.fn(gradient)} as unknown as CanvasRenderingContext2D;
}

describe('individual level illustration profiles',()=>{
  it('explicitly covers every level and gives each a different visual signature',()=>{
    expect(Object.keys(sceneryProfiles).sort()).toEqual(levels.map(level=>level.id).sort());
    const signatures=Object.values(sceneryProfiles).map(({name:_,...art})=>JSON.stringify(art));
    expect(new Set(signatures).size).toBe(levels.length);
    expect(sceneryProfile('unknown')).toBe(sceneryProfiles.bounce);
    expect(sceneryProfile('__proto__')).toBe(sceneryProfiles.bounce);
  });

  it.each(levels)('renders $id with its own static profile without changing its physics configuration',level=>{
    const before=structuredClone(level),profile=sceneryProfile(level.id),ctx=canvas();
    if(level.presentation==='bakery') {
      const colours:string[]=[];Object.defineProperty(ctx,'fillStyle',{set(value:string){colours.push(value);}});
      drawBakeryRoom(ctx,undefined,true,level.id);
      expect(colours).toContain(profile.bakery!.wall);expect(colours).toContain(profile.bakery!.plaster);
      expect(colours).toContain(profile.bakery!.window);expect(colours).toContain(profile.bakery!.awning);
      expect(ctx.fillText).toHaveBeenCalledWith(profile.bakery!.menu,344,253);
    } else {
      const scene=new LivingWorld(sceneryTheme(level));
      drawPuzzleBackdrop(ctx,1280,720,scene.snapshot(),undefined,true,profile);
      expect(vi.mocked(ctx.createLinearGradient).mock.results[0].value.addColorStop).toHaveBeenCalledWith(0,profile.sky[0]);
      if(scene.theme==='cosmos')expect(ctx.translate).toHaveBeenCalledWith(profile.planet[0],profile.planet[1]);
      else expect(ctx.arc).toHaveBeenCalledWith(...profile.sun,37,0,Math.PI*2);
    }
    expect(level).toEqual(before);
    expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
  });
});
