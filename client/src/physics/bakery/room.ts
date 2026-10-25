// Background artwork adapted from yihanzhao231's prototype (30d802f).
import { bakeryText, oval, roundRect, strokePath, type Ctx } from './drawing';
import { drawBread } from './bread';
import { sceneColours } from '../drawing-theme';
import type { AmbientFrame } from '../ambient-scenery';
import { drawAmbientScenery } from '../ambient-scenery-renderer';
import { sceneryProfile, sceneryProfiles } from '../scenery/profiles';
import { drawRoomAccent } from './room-accent';

export function drawBakeryRoom(ctx: Ctx,ambient?:AmbientFrame,reducedMotion=false,levelId='toaster') {
 const palette=sceneryProfile(levelId).bakery??sceneryProfiles.toaster.bakery!;
 ctx.fillStyle=sceneColours.bakeryBackground;ctx.fillRect(0,0,960,540);
 // Plaster wall and the shop's timber picture rail.
 ctx.fillStyle=palette.wall;ctx.fillRect(0,100,960,384);
 ctx.fillStyle=palette.plaster;ctx.fillRect(0,101,500,228);
 ctx.fillStyle='#decaa5';ctx.fillRect(0,329,500,155);
 for(let x=11;x<500;x+=32)strokePath(ctx,[[x,332],[x,482]],'#daceb7');
 ctx.fillStyle='#c6b18f';ctx.fillRect(0,327,500,5);
 ctx.fillStyle='#9c7548';ctx.fillRect(0,97,960,5);
 // Small engraved sign, not a laboratory HUD.
 bakeryText(ctx,'THE CORNER BAKERY',28,37,21,sceneColours.bakeryInk,'700');
 bakeryText(ctx,'A SMALL SHOP. DIFFERENT LAWS.',28,61,14,sceneColours.bakeryMuted);
 roundRect(ctx,788,22,145,51,5,'#e4d1a9');bakeryText(ctx,'ORDER 03',804,44,14,sceneColours.bakeryInk,'700');bakeryText(ctx,'ONE LOAF / AWAITING PICKUP',797,61,10,sceneColours.bakeryMuted);
 strokePath(ctx,[[28,80],[933,80]],'#d9cbb6');
 // Street-facing window: quiet buildings, striped awning, evening light.
 roundRect(ctx,43,125,243,195,5,'#b69a73');roundRect(ctx,50,132,229,181,2,palette.window);
 if(ambient)drawAmbientScenery(ctx,ambient,reducedMotion,{x:53,y:153,width:222,height:151,detailScale:.65});
 ctx.fillStyle='#d4d4c0';ctx.fillRect(53,209,100,101);ctx.fillStyle='#c5c8b5';ctx.fillRect(166,186,109,124);
 ctx.fillStyle='#e9e6d8';for(let x=66;x<263;x+=39){ctx.fillRect(x,224,15,25);ctx.fillRect(x,266,15,25);}
 if(palette.motif!=='moon')oval(ctx,224,169,19,19,palette.light);
 drawRoomAccent(ctx,palette);
 ctx.fillStyle='#f3e5c8';ctx.fillRect(51,133,227,20);
 for(let x=52;x<275;x+=35){ctx.fillStyle=palette.awning;ctx.fillRect(x,133,17,20);}
 ctx.fillStyle='#c2a780';ctx.fillRect(158,153,5,160);ctx.fillRect(51,219,227,5);
 roundRect(ctx,35,312,260,9,2,'#bba17b');
 // A soft sun patch keeps the otherwise restrained room warm.
 ctx.fillStyle=`${palette.light}35`;ctx.beginPath();ctx.moveTo(53,225);ctx.lineTo(158,225);ctx.lineTo(451,410);ctx.lineTo(209,410);ctx.closePath();ctx.fill();
 // Herbs and a ceramic cup on the window ledge.
 roundRect(ctx,69,290,23,22,3,'#ad9470');strokePath(ctx,[[80,293],[80,266]],'#8e9870',2);
 oval(ctx,73,279,9,4,'#929c79');oval(ctx,88,271,9,4,'#a1aa85');oval(ctx,75,266,7,3,'#929c79');
 roundRect(ctx,230,294,21,18,3,'#f9f3e7');ctx.strokeStyle='#c4b59e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(253,302,6,-Math.PI/2,Math.PI/2);ctx.stroke();
 // Open shelf, flour tin, loaf and jars.
 ctx.fillStyle='#b49670';ctx.fillRect(322,184,157,7);strokePath(ctx,[[332,191],[332,207],[345,191]],'#a68964',2);strokePath(ctx,[[467,191],[467,207],[454,191]],'#a68964',2);
 roundRect(ctx,330,143,30,40,3,'#e2d8c2');roundRect(ctx,328,140,34,6,2,'#aa9270');bakeryText(ctx,'FLOUR',334,168,7,'#8b7657','700');
 roundRect(ctx,369,154,22,29,3,'#d6ccb7');roundRect(ctx,368,151,24,5,2,'#8a8e70');drawBread(ctx,420,173,13,-.25);drawBread(ctx,447,171,14,.2);
 // Today's chalk menu sits behind the interactive objects.
 roundRect(ctx,329,225,144,107,3,'#9a7546');roundRect(ctx,335,231,132,95,1,'#3e5947');
 bakeryText(ctx,palette.menu,344,253,11,'#f0ead8','600');strokePath(ctx,[[348,263],[453,263]],'#a3a88e');
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
 roundRect(ctx,908,267,33,39,2,'#ece0c4');bakeryText(ctx,'03',914,291,17,'#947b53','600');bakeryText(ctx,'EXIT',909,326,11,'#9b8054','600');
 // Counter bodies stop precisely at the original collision edges.
 roundRect(ctx,55,434,440,47,1,'#a57b49');
 for(let x=68;x<400;x+=137){roundRect(ctx,x,443,123,29,2,'#bd9e75');strokePath(ctx,[[x+6,446],[x+116,446]],'#cbae84');roundRect(ctx,x+49,448,25,3,1,'#806c50');}
 ctx.fillStyle='#cfb48c';ctx.fillRect(55,420,440,14);ctx.fillStyle='#e1c8a0';ctx.fillRect(55,420,440,4);
 roundRect(ctx,856,434,104,47,1,'#a57b49');roundRect(ctx,864,444,89,29,2,'#bea17a');ctx.fillStyle='#d6ba91';ctx.fillRect(856,420,104,14);
 // Open aisle, not a false solid platform across the gap.
 ctx.fillStyle='#d4c19e';ctx.fillRect(0,483,960,57);
 for(let x=-30;x<990;x+=104)strokePath(ctx,[[x,484],[x-28,540]],'#c6b89e');strokePath(ctx,[[0,510],[960,510]],'#c9bca5');
 ctx.fillStyle='#af98744d';ctx.fillRect(55,478,440,5);ctx.fillRect(856,478,104,5);
 // Background linen basket, low enough to avoid implying a platform.
 roundRect(ctx,615,470,113,47,4,'#b9a889');for(let y=479;y<515;y+=9)strokePath(ctx,[[619,y],[725,y]],'#cbbb9b',2);
 ctx.fillStyle='#e8dfce';ctx.beginPath();ctx.moveTo(626,473);ctx.lineTo(634,459);ctx.lineTo(655,467);ctx.lineTo(687,461);ctx.lineTo(712,473);ctx.closePath();ctx.fill();
 bakeryText(ctx,'MIND THE GAP',577,449,14,sceneColours.bakeryInk);
}
