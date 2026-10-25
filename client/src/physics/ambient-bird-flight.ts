import type { AccelerationVector } from '../../../shared/acceleration';

export interface AmbientBird {
  readonly id:string;
  readonly kind:'bird'|'eagle';
  readonly x:number; readonly y:number; readonly vx:number; readonly vy:number;
  readonly heading:number; readonly liftAngle:number; readonly wingPhase:number;
  readonly effort:number;
}
export interface BirdFlightState {
  id:string; kind:AmbientBird['kind'];
  x:number; y:number; vx:number; vy:number;
  heading:number; liftAngle:number; wingPhase:number; effort:number;
  anchorX:number; anchorY:number; phase:number; speed:number;
}

const approach=(value:number,target:number,rate:number,dt:number)=>value+(target-value)*(1-Math.exp(-rate*dt));
const angleDifference=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function createBirdFlock(width:number,height:number):BirdFlightState[] {
  return [[.20,.19,0],[.22,.215,.19],[.24,.19,.39],[.56,.27,1.8],[.59,.25,2.02],[.76,.16,0]].map(([x,y,phase],i)=>{
    const kind=i===5?'eagle':'bird';
    const radius=kind==='eagle'?width*.085:width*.07;
    return {id:`ambient-${i}`,kind,x:x*width+Math.cos(phase)*radius,y:y*height-Math.sin(phase)*height*.045,
      vx:0,vy:0,heading:0,liftAngle:-Math.PI/2,wingPhase:i*.8,effort:1,anchorX:x*width,anchorY:y*height,phase,speed:kind==='eagle'?.29:.14};
  });
}

// Bounded distant flight, independent of Matter and of clouds' slower drift.
export function advanceBirdFlock(birds:BirdFlightState[],width:number,height:number,acceleration:Readonly<AccelerationVector>,dt:number) {
  const ax=clamp(Number.isFinite(acceleration.x)?acceleration.x:0,-100,100);
  const ay=clamp(Number.isFinite(acceleration.y)?acceleration.y:0,-100,100);
  const strength=Math.hypot(ax,ay),hasGravity=strength>.01;
  for(const bird of birds) {
    const targetLift=hasGravity?Math.atan2(-ay,-ax):bird.liftAngle;
    bird.liftAngle+=clamp(angleDifference(bird.liftAngle,targetLift),-1.1*dt,1.1*dt);
    // In zero acceleration the same flock coasts with smaller, slower strokes.
    bird.effort=approach(bird.effort,hasGravity?.55+.45*Math.min(1,strength/9.8):0,1.6,dt);
    bird.phase+=bird.speed*dt;
    const upX=Math.cos(bird.liftAngle),upY=Math.sin(bird.liftAngle);
    const forwardX=-upY,forwardY=upX;
    const rx=width*(bird.kind==='eagle'?.085:.07),ry=height*(bird.kind==='eagle'?.06:.045);
    const c=Math.cos(bird.phase),s=Math.sin(bird.phase);
    const targetX=bird.anchorX+forwardX*c*rx+upX*s*ry;
    const targetY=bird.anchorY+forwardY*c*rx+upY*s*ry;
    const tangentX=(-forwardX*s*rx+upX*c*ry)*bird.speed;
    const tangentY=(-forwardY*s*rx+upY*c*ry)*bird.speed;
    const desiredX=clamp(tangentX+(targetX-bird.x)*.5+ax*.035,-28,28);
    const desiredY=clamp(tangentY+(targetY-bird.y)*.5+ay*.035,-22,22);
    bird.vx=approach(bird.vx,desiredX,1.8,dt);bird.vy=approach(bird.vy,desiredY,1.8,dt);
    bird.x+=bird.vx*dt;bird.y+=bird.vy*dt;
    if(Math.hypot(bird.vx,bird.vy)>.2)bird.heading+=clamp(angleDifference(bird.heading,Math.atan2(bird.vy,bird.vx)),-1.9*dt,1.9*dt);
    bird.wingPhase+=(bird.kind==='eagle'?.9+.2*bird.effort:6.5+5.5*bird.effort)*dt;
  }
}

export function birdSnapshot({anchorX:_,anchorY:__,phase:___,speed:____,...bird}:BirdFlightState):AmbientBird {
  return {...bird};
}
