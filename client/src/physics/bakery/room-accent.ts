import type { BakeryPalette } from '../scenery/profiles';

/** Small background-only details give each visit to the same shop a different time of day. */
export function drawRoomAccent(ctx:CanvasRenderingContext2D,palette:BakeryPalette) {
  ctx.save();
  if(palette.motif==='bunting') {
    ctx.strokeStyle='#c9b390';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(319,112);ctx.quadraticCurveTo(397,128,478,112);ctx.stroke();
    for(let i=0;i<6;i++){
      const x=328+i*26,y=115+Math.sin(i/5*Math.PI)*6;ctx.fillStyle=i%2?'#d4b78e':'#c3c8a0';
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+13,y+1);ctx.lineTo(x+6,y+13);ctx.closePath();ctx.fill();
    }
  } else if(palette.motif==='pinwheel') {
    ctx.strokeStyle='#8fa49b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(245,182);ctx.lineTo(245,204);ctx.stroke();
    for(let i=0;i<4;i++) {
      ctx.save();ctx.translate(245,181);ctx.rotate(i*Math.PI/2);ctx.fillStyle=i%2?'#b5cbb8':'#dbe5c4';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-12);ctx.lineTo(10,-8);ctx.closePath();ctx.fill();ctx.restore();
    }
  } else {
    ctx.fillStyle='#ede7cf';ctx.beginPath();ctx.arc(231,173,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=palette.window;ctx.beginPath();ctx.arc(236,169,11,0,Math.PI*2);ctx.fill();
    for(const [x,y] of [[195,169],[260,188],[214,193]]){ctx.fillStyle='#f4edda';ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
