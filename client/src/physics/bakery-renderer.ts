import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';
import { STEP_MS } from './world';

// Scene artwork adapted from yihanzhao231's temp/1024-zyh prototype (30d802f).
// Rendering reads the Matter.js world; no simulation or command parser lives here.
type Ctx = CanvasRenderingContext2D;
function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

export function drawBakery(ctx: Ctx, world: PhysicsWorld, trail: readonly Point[]) {
  const { level, rules } = world;
  const time = world.tick * STEP_MS / 1000;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawBakeryRoom(ctx);
  for (const device of level.devices || []) {
    const values = rules.values[device.id] || {};
    switch (device.kind) {
      case 'conveyor': {
        const { x, width } = device.area;
        const track = level.tracks[0];
        const y = track.points[0][1] - track.thickness / 2;
        const speed = values.conveyor_speed ?? device.speed;
        roundRect(ctx,x,y,width,17,8,'#59634f');
        roundRect(ctx,x+5,y+1,width-10,5,2,'#8c9b76');
        ctx.save(); ctx.beginPath(); ctx.rect(x+8,y+1,width-16,13); ctx.clip();
        const offset = ((time*speed*30)%24+24)%24;
        for(let bx=x-12;bx<x+width;bx+=24) strokePath(ctx,[[bx+offset,y+3],[bx+7+offset,y+12]],'#bdc6a3',2);
        ctx.restore(); tag(ctx,'01 / CONVEYOR',x+65,y+31,124); break;
      }
      case 'spring': {
        const { x, y } = device.area;
        const popped = world.devices.firedSprings.has(device.id) ? 7 : 0;
        roundRect(ctx,x-15,y+21,49,31,6,'#bdbea7');
        roundRect(ctx,x-9,y+17-popped,36,7,3,'#626e55');
        const coil: Point[] = [[x+5,y+46]];
        for(let i=0;i<5;i++) coil.push([x+5+(i%2?6:-5),y+43-i*(3+popped*.25)]);
        strokePath(ctx,coil,'#836542',2);
        roundRect(ctx,x+26,y+32,6,5,2,'#6d775d');
        oval(ctx,x-8,y+39,2.4,2.4,(values.spring_power ?? device.power)>0?'#6e8b44':'#aaa48a');
        tag(ctx,'02 / TOASTER',x-66,451,124); break;
      }
      case 'fan': {
        const { x, y, width, height } = device.area;
        const power = values.fan_power ?? device.power;
        ctx.fillStyle = '#819b650c'; ctx.fillRect(x,y,width,height);
        ctx.setLineDash([4,8]); ctx.lineWidth = 1;
        ctx.strokeStyle = power ? '#81996699' : '#9aab844d'; ctx.strokeRect(x,y,width,height); ctx.setLineDash([]);
        // Side view of an upward-facing fan: horizontal grille, vertical airflow.
        const fx=x+66, fy=y+height-18;
        roundRect(ctx,fx-25,fy+5,50,12,4,'#6d7d5b');
        oval(ctx,fx,fy+3,28,9,'#81916c'); oval(ctx,fx,fy,25,8,'#d8dfc8');
        ctx.save();ctx.translate(fx,fy);ctx.scale(1,.29);ctx.rotate(time*power*9);
        for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);oval(ctx,0,-12,5,12,'#7c9162');}
        oval(ctx,0,0,4,4,'#536945');ctx.restore();
        strokePath(ctx,[[fx-22,fy-3],[fx+22,fy-3]],'#a7b798',1.5);
        tag(ctx,'03 / UPDRAFT FAN',x+8,346,139);
        ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
        for(let i=0;i<5;i++) {
          const distance=(time*Math.abs(power)*100+i*48)%Math.max(1,height-35);
          const ay=power<0?y+15+distance:y+height-22-distance;
          const ax=x+72+i*43, direction=power<0?1:-1;
          strokePath(ctx,[[ax,ay-direction*15],[ax,ay]],power?'#5c7b43aa':'#8e9c7b66',1.6);
          strokePath(ctx,[[ax-4,ay-direction*5],[ax,ay],[ax+4,ay-direction*5]],power?'#5c7b43aa':'#8e9c7b66',1.6);
        }
        ctx.restore(); break;
      }
      case 'rotor': {
        const [x,y] = device.position, r = device.radius;
        roundRect(ctx,x-r-11,y-r-10,r*2+22,r*2+21,5,'#c0c7af');
        oval(ctx,x,y,r+3,r+3,'#8b9b79'); oval(ctx,x,y,r,r,'#e0e6d3');
        ctx.save();ctx.translate(x,y);ctx.rotate(world.devices.rotors.get(device.id)?.angle ?? 0);
        for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);oval(ctx,0,-r/2,6,r/2-1,'#92a47c');}
        oval(ctx,0,0,7,7,'#657e50');ctx.restore();
        bakeryText(ctx,'VENT WHEEL',x-r-8,y+r+22,10,'#6d7c59');break;
      }
      case 'sensor': {
        const [x,y] = device.position;
        const trigger = rules.triggers.find(item => item.sensor === device.id);
        const open = trigger && world.devices.openGates.has(trigger.gate);
        ctx.setLineDash([3,7]);ctx.strokeStyle=open?'#67934c':trigger?'#9a8052':'#a99b7c88';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(x,y,device.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        oval(ctx,x,y,17,17,'#b99a63');oval(ctx,x,y-1,13,13,'#e4c88f');
        strokePath(ctx,[[x,y-11],[x,y-1],[x+7,y+2]],'#8a6a39',1.5);
        tag(ctx,open?'04 / DING!':'04 / PICKUP BELL',x-50,y+47,134);break;
      }
      case 'gate': {
        const { x,y,width,height } = device.area;
        const open = world.devices.openGates.has(device.id), h = open?26:height;
        roundRect(ctx,x,y,width,h,1,'#879675');
        for(let gy=y+5;gy<y+h;gy+=8)strokePath(ctx,[[x+3,gy],[x+width-3,gy]],'#5f7453');
        bakeryText(ctx,open?'PICKUP →':'WAIT FOR BELL',x+26,382,10,open?'#54763f':'#806d51','600');break;
      }
    }
  }
  if(trail.length>1){ctx.setLineDash([2,7]);strokePath(ctx,trail,'#9b784c99',1.7);ctx.setLineDash([]);}
  const { x,y }=world.ball.position, r=level.ball.radius;
  drawBread(ctx,x,y,r,world.ball.angle);
  if(!world.started) bakeryText(ctx,'START',143,389,10,'#806d51','600');
  bakeryText(ctx,'THE LAST ORDER / CHANGE THE RULES. CHOOSE THE MOMENT.',27,530,10,'#806d51');
  if(world.won || world.timedOut){
    roundRect(ctx,218,205,524,105,6,'#fffaf0ef');
    bakeryText(ctx,world.won?'One last loaf. Delivered.':world.fell?'Mind the gap. Try a different timing.':'Time is up. Try a different timing.',239,246,23,world.won?'#537640':'#8b6241','700');
    bakeryText(ctx,'Retry keeps your rules. Reset starts fresh.',240,280,14,'#806d51');
  }
}
function strokePath(ctx: Ctx, points: readonly Point[], color = '#b9a58a', width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
}
function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
}
function bakeryText(ctx: Ctx, text: string, x: number, y: number, size = 12, color = '#756149', weight = '500') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.fillStyle = color; ctx.fillText(text,x,y);
}
function tag(ctx: Ctx, label: string, x: number, y: number, width = 110) {
  roundRect(ctx,x,y,width,23,4,'#fffaf0'); bakeryText(ctx,label,x+7,y+16,11,'#66533d','600');
}
function drawBread(ctx: Ctx, x: number, y: number, r: number, rotation = 0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation);
  oval(ctx,0,2,r+1,r-1,'#80522b'); oval(ctx,0,-1,r,r-1,'#c88e43'); oval(ctx,-3,-4,r*.72,r*.54,'#e0b878');
  ctx.strokeStyle='#fff0c9'; ctx.lineWidth=2.4; ctx.lineCap='round';
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-5+i*5,-6);ctx.lineTo(-8+i*5,0);ctx.stroke();}
  ctx.restore();
}
function drawBakeryRoom(ctx: Ctx) {
 ctx.fillStyle='#f5edde';ctx.fillRect(0,0,960,540);
 // Plaster wall and the shop's timber picture rail.
 ctx.fillStyle='#eee3cf';ctx.fillRect(0,100,960,384);
 ctx.fillStyle='#f7f1e7';ctx.fillRect(0,101,500,228);
 ctx.fillStyle='#e6d9c3';ctx.fillRect(0,329,500,155);
 for(let x=11;x<500;x+=32)strokePath(ctx,[[x,332],[x,482]],'#daceb7');
 ctx.fillStyle='#c6b18f';ctx.fillRect(0,327,500,5);
 ctx.fillStyle='#b89a6d';ctx.fillRect(0,97,960,5);
 // Small engraved sign, not a laboratory HUD.
 bakeryText(ctx,'THE CORNER BAKERY',28,37,19,'#5d4a34','700');
 bakeryText(ctx,'A SMALL SHOP. DIFFERENT LAWS.',28,61,12,'#998368');
 roundRect(ctx,788,22,145,51,5,'#e9dfcd');bakeryText(ctx,'ORDER 08',804,44,12,'#806a4d','700');bakeryText(ctx,'ONE LOAF / AWAITING PICKUP',797,61,8,'#9b8260');
 strokePath(ctx,[[28,80],[933,80]],'#d9cbb6');
 // Street-facing window: quiet buildings, striped awning, evening light.
 roundRect(ctx,43,125,243,195,5,'#b69a73');roundRect(ctx,50,132,229,181,2,'#dfdfce');
 ctx.fillStyle='#d4d4c0';ctx.fillRect(53,209,100,101);ctx.fillStyle='#c5c8b5';ctx.fillRect(166,186,109,124);
 ctx.fillStyle='#e9e6d8';for(let x=66;x<263;x+=39){ctx.fillRect(x,224,15,25);ctx.fillRect(x,266,15,25);}
 oval(ctx,224,169,19,19,'#eee4c5');
 ctx.fillStyle='#f3e5c8';ctx.fillRect(51,133,227,20);
 for(let x=52;x<275;x+=35){ctx.fillStyle='#a8ad94';ctx.fillRect(x,133,17,20);}
 ctx.fillStyle='#c2a780';ctx.fillRect(158,153,5,160);ctx.fillRect(51,219,227,5);
 roundRect(ctx,35,312,260,9,2,'#bba17b');
 // A soft sun patch keeps the otherwise restrained room warm.
 ctx.fillStyle='#fffbec35';ctx.beginPath();ctx.moveTo(53,225);ctx.lineTo(158,225);ctx.lineTo(451,410);ctx.lineTo(209,410);ctx.closePath();ctx.fill();
 // Herbs and a ceramic cup on the window ledge.
 roundRect(ctx,69,290,23,22,3,'#ad9470');strokePath(ctx,[[80,293],[80,266]],'#8e9870',2);
 oval(ctx,73,279,9,4,'#929c79');oval(ctx,88,271,9,4,'#a1aa85');oval(ctx,75,266,7,3,'#929c79');
 roundRect(ctx,230,294,21,18,3,'#f9f3e7');ctx.strokeStyle='#c4b59e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(253,302,6,-Math.PI/2,Math.PI/2);ctx.stroke();
 // Open shelf, flour tin, loaf and jars.
 ctx.fillStyle='#b49670';ctx.fillRect(322,184,157,7);strokePath(ctx,[[332,191],[332,207],[345,191]],'#a68964',2);strokePath(ctx,[[467,191],[467,207],[454,191]],'#a68964',2);
 roundRect(ctx,330,143,30,40,3,'#e2d8c2');roundRect(ctx,328,140,34,6,2,'#aa9270');bakeryText(ctx,'FLOUR',334,168,7,'#8b7657','700');
 roundRect(ctx,369,154,22,29,3,'#d6ccb7');roundRect(ctx,368,151,24,5,2,'#8a8e70');drawBread(ctx,420,173,13,-.25);drawBread(ctx,447,171,14,.2);
 // Today's chalk menu sits behind the interactive objects.
 roundRect(ctx,329,225,144,107,3,'#b19469');roundRect(ctx,335,231,132,95,1,'#626957');
 bakeryText(ctx,'FRESH TODAY',355,253,14,'#f0ead8','600');strokePath(ctx,[[348,263],[453,263]],'#a3a88e');
 bakeryText(ctx,'One last round loaf',348,283,11,'#e3dfca');bakeryText(ctx,'Ready when you are.',348,307,10,'#c5c9af');
 // Warm white tiles in the cooling / service bay.
 ctx.fillStyle='#ede8da';ctx.fillRect(500,103,332,317);
 for(let y=103;y<421;y+=34){strokePath(ctx,[[500,y],[832,y]],'#ddd5c5');for(let x=500+(Math.floor(y/34)%2)*27;x<832;x+=55)strokePath(ctx,[[x,y],[x,y+34]],'#ddd5c5');}
 // Exhaust hood. The interactive rotor remains at its original coordinates.
 roundRect(ctx,532,112,266,24,3,'#b8b8a4');roundRect(ctx,552,118,226,8,2,'#999f8b');
 strokePath(ctx,[[545,139],[812,139]],'#c8c7b5');
 // Service hatch frame: its shutter is the original gate at x=833.
 ctx.fillStyle='#c0a37b';ctx.fillRect(829,140,131,9);ctx.fillRect(855,149,6,271);
 ctx.fillStyle='#ddd5bf';ctx.fillRect(861,149,99,271);
 roundRect(ctx,872,164,76,33,3,'#f8f0dc');bakeryText(ctx,'PICKUP',881,186,12,'#806c4d','600');
 // Bag target exactly wraps the original exit rectangle (897,213,55,137).
 ctx.fillStyle='#d4b580';ctx.beginPath();ctx.moveTo(897,238);ctx.lineTo(904,213);ctx.lineTo(914,220);ctx.lineTo(924,213);ctx.lineTo(936,220);ctx.lineTo(945,213);ctx.lineTo(952,238);ctx.lineTo(952,350);ctx.lineTo(897,350);ctx.closePath();ctx.fill();
 ctx.fillStyle='#bb9863';ctx.fillRect(897,239,7,111);ctx.fillStyle='#e0c695';ctx.fillRect(904,239,41,111);
 strokePath(ctx,[[916,252],[916,237],[936,237],[936,252]],'#a18354',2);
 roundRect(ctx,908,267,33,39,2,'#ece0c4');bakeryText(ctx,'08',914,291,17,'#947b53','600');bakeryText(ctx,'EXIT',909,326,11,'#9b8054','600');
 // Counter bodies stop precisely at the original collision edges.
 roundRect(ctx,55,434,440,47,1,'#b39268');
 for(let x=68;x<400;x+=137){roundRect(ctx,x,443,123,29,2,'#bd9e75');strokePath(ctx,[[x+6,446],[x+116,446]],'#cbae84');roundRect(ctx,x+49,448,25,3,1,'#806c50');}
 ctx.fillStyle='#cfb48c';ctx.fillRect(55,420,440,14);ctx.fillStyle='#e1c8a0';ctx.fillRect(55,420,440,4);
 roundRect(ctx,856,434,104,47,1,'#b39268');roundRect(ctx,864,444,89,29,2,'#bea17a');ctx.fillStyle='#d6ba91';ctx.fillRect(856,420,104,14);
 // Open aisle, not a false solid platform across the gap.
 ctx.fillStyle='#d9cdb9';ctx.fillRect(0,483,960,57);
 for(let x=-30;x<990;x+=104)strokePath(ctx,[[x,484],[x-28,540]],'#c6b89e');strokePath(ctx,[[0,510],[960,510]],'#c9bca5');
 ctx.fillStyle='#af98744d';ctx.fillRect(55,478,440,5);ctx.fillRect(856,478,104,5);
 // Background linen basket, low enough to avoid implying a platform.
 roundRect(ctx,615,470,113,47,4,'#b9a889');for(let y=479;y<515;y+=9)strokePath(ctx,[[619,y],[725,y]],'#cbbb9b',2);
 ctx.fillStyle='#e8dfce';ctx.beginPath();ctx.moveTo(626,473);ctx.lineTo(634,459);ctx.lineTo(655,467);ctx.lineTo(687,461);ctx.lineTo(712,473);ctx.closePath();ctx.fill();
 bakeryText(ctx,'MIND THE GAP',577,449,12,'#a28d6e');
}
