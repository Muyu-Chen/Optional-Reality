import type { SceneryProfile } from './profiles';

/** Quiet landmarks belong to the distant illustration, never to the playable apparatus. */
export function drawLandscapeLandmark(ctx:CanvasRenderingContext2D,profile:SceneryProfile) {
  ctx.save();ctx.lineCap='round';
  if(profile.feature==='viaduct') {
    ctx.strokeStyle='#aa9e9e';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(5,462);ctx.lineTo(253,462);ctx.stroke();
    ctx.lineWidth=7;for(const x of [23,81,139,197]){
      ctx.beginPath();ctx.moveTo(x,508);ctx.lineTo(x,490);ctx.bezierCurveTo(x,460,x+43,460,x+43,490);ctx.lineTo(x+43,508);ctx.stroke();
    }
    ctx.strokeStyle='#c8b9b1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(3,454);ctx.lineTo(254,454);ctx.stroke();
  } else if(profile.feature==='windmill') {
    ctx.fillStyle='#c5b18a';ctx.beginPath();ctx.moveTo(120,535);ctx.lineTo(132,466);ctx.lineTo(151,466);ctx.lineTo(163,535);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#eee3c5';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(114,447);ctx.lineTo(169,501);ctx.moveTo(168,447);ctx.lineTo(114,501);ctx.stroke();
    ctx.fillStyle='#9a9c83';ctx.beginPath();ctx.arc(141,474,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c6b57f';ctx.lineWidth=1.5;
    for(let i=0;i<15;i++){const x=19+i*14,y=555+(i%3)*5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-13);ctx.moveTo(x-2,y-9);ctx.lineTo(x-7,y-13);ctx.moveTo(x-2,y-5);ctx.lineTo(x+3,y-10);ctx.stroke();}
  } else if(profile.feature==='lake') {
    ctx.fillStyle='#acd1ce';ctx.beginPath();ctx.ellipse(160,537,177,34,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#deebdc';ctx.lineWidth=2;
    for(const [x,y,w] of [[28,529,48],[151,550,66],[206,525,53]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();}
    ctx.fillStyle='#f5ebd5';ctx.beginPath();ctx.moveTo(157,522);ctx.lineTo(157,487);ctx.lineTo(179,520);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#9ca9a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(156,489);ctx.lineTo(156,530);ctx.stroke();
    ctx.fillStyle='#9aaea1';ctx.beginPath();ctx.moveTo(142,527);ctx.lineTo(182,527);ctx.lineTo(173,534);ctx.lineTo(149,534);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
