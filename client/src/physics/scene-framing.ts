import type { PhysicsWorld } from './world';
import { playAreaBounds, type PlayAreaBounds } from './play-area';
import { overtimeReveal } from './overtime';

export interface SceneInsets { left: number; right: number; top: number; bottom: number }

function fit(area: PlayAreaBounds, canvas: { width: number; height: number }, insets: SceneInsets, alignLeft = false) {
  const width=area.right-area.left,height=area.bottom-area.top;
  const availableWidth=Math.max(1,canvas.width-insets.left-insets.right);
  const availableHeight=Math.max(1,canvas.height-insets.top-insets.bottom);
  const scale=Math.min(availableWidth/width,availableHeight/height);
  return {
    scale,
    x:insets.left+(alignLeft?0:(availableWidth-width*scale)/2)-area.left*scale,
    y:insets.top+(availableHeight-height*scale)/2-area.top*scale,
  };
}

/** Fit the playable world inside the HUD, easing out to reveal the rescue space. */
export function sceneFraming(world: Pick<PhysicsWorld, 'level' | 'playArea' | 'overtime' | 'tick' | 'limitTicks'>,
  canvas: { width: number; height: number }, insets: SceneInsets, reduced = false) {
  const original=fit(playAreaBounds(world.level),canvas,insets);
  // The rescue left wall meets the screen edge, including height-constrained layouts.
  const rescue=fit(world.playArea,canvas,{...insets,left:0},true);
  const progress=overtimeReveal(world,reduced),ease=progress*progress*(3-2*progress);
  const mix=(from:number,to:number)=>from+(to-from)*ease;
  const clipLeft=mix(insets.left,0);
  return {
    scale:mix(original.scale,rescue.scale),x:mix(original.x,rescue.x),y:mix(original.y,rescue.y),clipLeft,
    availableWidth:Math.max(1,canvas.width-clipLeft-insets.right),
    availableHeight:Math.max(1,canvas.height-insets.top-insets.bottom),
  };
}
