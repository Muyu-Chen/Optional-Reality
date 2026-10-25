import { describe, expect, it } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { playAreaBounds } from './play-area';
import { sceneFraming } from './scene-framing';

const insets={left:28,right:366,top:96,bottom:78};
const world=(overtime=false,tick=0)=>({level:gravityLab,playArea:playAreaBounds(gravityLab,overtime),overtime,tick,limitTicks:3600});
const screen={width:1366,height:768};

describe('rescue camera framing',()=>{
  it('preserves the normal centred scene and its HUD margins',()=>{
    const frame=sceneFraming(world(),screen,insets),scale=Math.min(972/800,594/510);
    expect(frame.scale).toBeCloseTo(scale);
    expect(frame.x).toBeCloseTo(28+(972-800*scale)/2);
    expect(frame.y).toBeCloseTo(96+(594-510*scale)/2);
    expect(frame.clipLeft).toBe(28);
  });
  it.each([
    [1024,768,1],[1366,768,1],[1920,1080,1],[1366,768,2],[1920,700,2],
  ])('fits expanded top/right space and pins the left collision edge to the screen at %s×%s @%s',(width,height,ratio)=>{
    const pixels={width:width*ratio,height:height*ratio};
    const margins=Object.fromEntries(Object.entries(insets).map(([key,value])=>[key,value*ratio])) as typeof insets;
    const frame=sceneFraming(world(true,3659),pixels,margins);
    expect(frame.x).toBe(0);expect(frame.clipLeft).toBe(0);
    expect(frame.x+960*frame.scale).toBeLessThanOrEqual(pixels.width-margins.right+.0001);
    expect(frame.y-102*frame.scale).toBeGreaterThanOrEqual(margins.top-.0001);
    expect(frame.y+510*frame.scale).toBeLessThanOrEqual(pixels.height-margins.bottom+.0001);
    expect(frame.availableWidth).toBe(pixels.width-margins.right);
  });
  it('eases the camera over half a simulated second, with no movement while paused',()=>{
    const normal=sceneFraming(world(),screen,insets);
    const first=sceneFraming(world(true,3600),screen,insets);
    const middle=sceneFraming(world(true,3629),screen,insets);
    const final=sceneFraming(world(true,3659),screen,insets);
    expect(first.scale).toBeCloseTo(normal.scale,3);
    expect(first.x).toBeCloseTo(normal.x,0);
    expect(middle.scale).toBeCloseTo((normal.scale+final.scale)/2);
    expect(middle.x).toBeCloseTo(normal.x/2);
    expect(middle).toEqual(sceneFraming(world(true,3629),screen,insets));
    expect(final).toEqual(sceneFraming(world(true,3900),screen,insets));
  });
  it('shows all rescue space immediately with reduced motion, and restores normal framing on retry',()=>{
    expect(sceneFraming(world(true,3600),screen,insets,true)).toEqual(sceneFraming(world(true,3659),screen,insets));
    expect(sceneFraming(world(false,0),screen,insets,true)).toEqual(sceneFraming(world(),screen,insets));
  });
});
