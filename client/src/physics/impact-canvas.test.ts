// @vitest-environment jsdom
import Matter from 'matter-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { CanvasLab } from './canvas-lab';
import { drawGeometry } from './geometry-renderer';

vi.mock('./geometry-renderer', () => ({ drawGeometry: vi.fn() }));
vi.mock('./scene-backdrop', () => ({ drawPuzzleBackdrop: vi.fn() }));
vi.mock('./bakery-renderer', () => ({ drawBakery: vi.fn() }));
vi.mock('./star-renderer', () => ({ drawStars: vi.fn() }));
vi.mock('./exit-transition-renderer', () => ({ drawExitTransition: vi.fn() }));
let frames: Map<number, FrameRequestCallback>, next: number, lab: CanvasLab | undefined;
let motion: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

beforeEach(() => {
  frames=new Map();next=0;
  motion={matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()};
  vi.stubGlobal('matchMedia',()=>motion);
  vi.spyOn(document,'hidden','get').mockReturnValue(false);
  const context={setTransform:vi.fn(),clearRect:vi.fn(),fillRect:vi.fn(),save:vi.fn(),restore:vi.fn(),translate:vi.fn(),
    rotate:vi.fn(),beginPath:vi.fn(),ellipse:vi.fn(),stroke:vi.fn()};
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.stubGlobal('ResizeObserver',class { observe(){} disconnect(){} });
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++next,callback);return next;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
});
afterEach(()=>{lab?.destroy();lab=undefined;vi.restoreAllMocks();vi.unstubAllGlobals();});
function frame(time:number){const [id,callback]=frames.entries().next().value!;frames.delete(id);callback(time);}
const pose=()=>vi.mocked(drawGeometry).mock.lastCall?.[5];

describe('impact drawing in the real Canvas lifecycle',()=>{
  it('passes the contact pose to the actor layer, freezes it on pause/hidden and clears it on retry',()=>{
    const canvas=document.createElement('canvas');
    Object.defineProperties(canvas,{clientWidth:{value:1366},clientHeight:{value:768}});
    lab=new CanvasLab(canvas,gravityLab,()=>{});
    Matter.Body.setPosition(lab.world.ball,{x:570,y:250});
    Matter.Body.setVelocity(lab.world.ball,{x:0,y:3});
    lab.world.setGravity(1);lab.world.start();frame(1);
    for(let i=1;i<60&&!pose();i++)frame(1+i*1000/60);
    expect(pose()).toBeDefined();
    expect(pose()!.normalScale).toBeLessThan(1);
    const before=structuredClone(pose());
    lab.world.pause();frame(5000);frame(10000);
    expect(pose()).toEqual(before);
    vi.spyOn(document,'hidden','get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));frame(20000);
    expect(pose()).toEqual(before);
    lab.reset();expect(pose()).toBeUndefined();
    lab.destroy();expect(frames.size).toBe(0);
  });

  it('drops old deformation immediately when reduced motion is enabled without replaying it later',()=>{
    const canvas=document.createElement('canvas');
    Object.defineProperties(canvas,{clientWidth:{value:1366},clientHeight:{value:768}});
    lab=new CanvasLab(canvas,gravityLab,()=>{});
    Matter.Body.setPosition(lab.world.ball,{x:570,y:250});Matter.Body.setVelocity(lab.world.ball,{x:0,y:3});
    lab.world.setGravity(1);lab.world.start();frame(1);
    for(let i=1;i<60&&!pose();i++)frame(1+i*1000/60);
    expect(pose()).toBeDefined();lab.world.pause();
    const changed=motion.addEventListener.mock.calls.find(([event])=>event==='change')![1];
    motion.matches=true;changed();expect(pose()).toBeUndefined();
    motion.matches=false;changed();frame(10000);expect(pose()).toBeUndefined();
  });
});
