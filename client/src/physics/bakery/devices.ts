// Device artwork adapted from yihanzhao231's prototype (30d802f).
import type { DeviceDefinition, Point } from '../../levels/types';
import { STEP_MS, type PhysicsWorld } from '../world';
import { bakeryText, oval, roundRect, strokePath, tag, type Ctx } from './drawing';
import { ruleContext } from '../../levels/rules';
import { drawForceArrow, physicsColours } from '../visual-language';

function permission(world: PhysicsWorld, id: string) {
  const target = ruleContext(world.level).targets.find(item => item.id === id);
  return target?.editableProperties?.length === 0 ? 'PRESET' : 'EDITABLE';
}

export function drawBakeryDevice(ctx: Ctx, device: DeviceDefinition, world: PhysicsWorld) {
  switch (device.kind) {
    case 'conveyor': return drawConveyor(ctx, device, world);
    case 'spring': return drawToaster(ctx, device, world);
    case 'fan': return drawFan(ctx, device, world);
    case 'rotor': return drawRotor(ctx, device, world);
    case 'sensor': return drawSensor(ctx, device, world);
    case 'gate': return drawGate(ctx, device, world);
  }
}

function drawConveyor(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'conveyor'}>, world: PhysicsWorld) {
  const { level, rules } = world;
  const values = rules.values[device.id] || {};
  const time = world.tick * STEP_MS / 1000;
  const { x, width } = device.area;
  const track = level.tracks[0];
  const y = track.points[0][1] - track.thickness / 2;
  const speed = values.conveyor_speed ?? device.speed;
  roundRect(ctx,x,y,width,17,8,'#59634f');
  roundRect(ctx,x+5,y+1,width-10,5,2,physicsColours.drive);
  ctx.save(); ctx.beginPath(); ctx.rect(x+8,y+1,width-16,13); ctx.clip();
  const offset = ((time*speed*30)%24+24)%24;
  for(let bx=x-12;bx<x+width;bx+=24) {
    const direction = Math.sign(speed);
    strokePath(ctx,[[bx+offset-direction*4,y+4],[bx+offset+direction*3,y+7],[bx+offset-direction*4,y+10]],'#f7d4a5',2);
  }
  ctx.restore(); tag(ctx,`CONVEYOR · ${permission(world,device.id)}`,x+40,y+31,170);
}

function drawToaster(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'spring'}>, world: PhysicsWorld) {
  const values = world.rules.values[device.id] || {};
  const { x, y } = device.area;
  const state=world.devices.springs.get(device.id);
  const charging=state?.phase === 'charging';
  const fraction=charging ? Math.min(1,state.elapsed/(device.chargeSeconds || .6)) : 0;
  const popped = state?.phase === 'launched' ? 7 : -fraction*8;
  if(charging){
    ctx.strokeStyle=physicsColours.bounce;ctx.lineWidth=2;ctx.setLineDash([4,4]);
    ctx.strokeRect(x-22,y+9,70,55);ctx.setLineDash([]);
    bakeryText(ctx,'STORING ENERGY',x-24,y-2,10,physicsColours.bounce,'700');
    roundRect(ctx,x-14,y+58,48,3,1,'#d0cfaf');roundRect(ctx,x-14,y+58,Math.max(1,48*fraction),3,1,physicsColours.bounce);
  }
  roundRect(ctx,x-15,y+21,49,31,6,'#bdbea7');
  roundRect(ctx,x-9,y+17-popped,36,7,3,physicsColours.bounce);
  const coil: Point[] = [[x+5,y+46]];
  for(let i=0;i<5;i++) coil.push([x+5+(i%2?6:-5),y+43-i*(3+popped*.25)]);
  strokePath(ctx,coil,physicsColours.bounce,2.5);
  roundRect(ctx,x+26,y+32,6,5,2,'#6d775d');
  oval(ctx,x-8,y+39,2.4,2.4,(values.spring_power ?? device.power)>0?physicsColours.bounce:'#aaa48a');
  tag(ctx,`TOASTER · ${permission(world,device.id)}`,x-66,451,164);
}

function drawFan(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'fan'}>, world: PhysicsWorld) {
  const values = world.rules.values[device.id] || {};
  const time = world.tick * STEP_MS / 1000;
  const { x, y, width, height } = device.area;
  const power = values.fan_power ?? device.power;
  ctx.fillStyle = `${physicsColours.drive}0c`; ctx.fillRect(x,y,width,height);
  ctx.setLineDash([4,8]); ctx.lineWidth = 1;
  ctx.strokeStyle = `${physicsColours.drive}${power ? '99' : '4d'}`; ctx.strokeRect(x,y,width,height); ctx.setLineDash([]);
  // Side view of an upward-facing fan: horizontal grille, vertical airflow.
  const fx=x+66, fy=y+height-18;
  roundRect(ctx,fx-25,fy+5,50,12,4,physicsColours.drive);
  oval(ctx,fx,fy+3,28,9,'#81916c'); oval(ctx,fx,fy,25,8,'#d8dfc8');
  ctx.save();ctx.translate(fx,fy);ctx.scale(1,.29);ctx.rotate(time*power*9);
  for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);oval(ctx,0,-12,5,12,physicsColours.drive);}
  oval(ctx,0,0,4,4,'#536945');ctx.restore();
  strokePath(ctx,[[fx-22,fy-3],[fx+22,fy-3]],'#a7b798',1.5);
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  for(let i=0;power !== 0 && x+24+i*44<x+width-16;i++) {
    const distance=(time*Math.abs(power)*100+i*48)%Math.max(1,height-35);
    const ay=power<0?y+15+distance:y+height-22-distance;
    const ax=x+24+i*44;
    drawForceArrow(ctx,ax,ay,[device.acceleration[0]*power,device.acceleration[1]*power],18,physicsColours.drive);
  }
  ctx.restore();
  tag(ctx,`${power === 0 ? 'AIRFLOW OFF' : 'AIRFLOW'} · ${permission(world,device.id)}`,x+8,346,174);
}

function drawRotor(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'rotor'}>, world: PhysicsWorld) {
  const [x,y] = device.position, r = device.radius;
  roundRect(ctx,x-r-11,y-r-10,r*2+22,r*2+21,5,'#c0c7af');
  oval(ctx,x,y,r+3,r+3,'#8b9b79'); oval(ctx,x,y,r,r,'#e0e6d3');
  ctx.save();ctx.translate(x,y);ctx.rotate(world.devices.rotors.get(device.id)?.angle ?? 0);
  for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);oval(ctx,0,-r/2,6,r/2-1,physicsColours.drive);}
  oval(ctx,0,0,7,7,'#657e50');ctx.restore();
  bakeryText(ctx,'VENT WHEEL',x-r-8,y+r+22,10,'#6d7c59');
}

function drawSensor(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'sensor'}>, world: PhysicsWorld) {
  const { rules } = world;
  const [x,y] = device.position;
  const trigger = rules.triggers.find(item => item.sensor === device.id);
  const open = trigger && world.devices.openGates.has(trigger.gate);
  ctx.setLineDash([3,7]);ctx.strokeStyle=open?'#67934c':trigger?'#9a8052':'#a99b7c88';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(x,y,device.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  oval(ctx,x,y,17,17,'#b99a63');oval(ctx,x,y-1,13,13,'#e4c88f');
  strokePath(ctx,[[x,y-11],[x,y-1],[x+7,y+2]],'#8a6a39',1.5);
  tag(ctx,open?'04 / DING!':'04 / PICKUP BELL',x-50,y+47,134);
}

function drawGate(ctx: Ctx, device: Extract<DeviceDefinition, {kind: 'gate'}>, world: PhysicsWorld) {
  const { x,y,width,height } = device.area;
  const open = world.devices.openGates.has(device.id), h = open?26:height;
  roundRect(ctx,x,y,width,h,1,'#879675');
  for(let gy=y+5;gy<y+h;gy+=8)strokePath(ctx,[[x+3,gy],[x+width-3,gy]],'#5f7453');
  bakeryText(ctx,open?'PICKUP →':'WAIT FOR BELL',x+26,382,10,open?'#54763f':'#806d51','600');
}
