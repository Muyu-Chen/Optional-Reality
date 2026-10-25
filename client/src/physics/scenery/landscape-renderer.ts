import { sceneryLayout } from './layout';
import type { LivingFrame } from './living-world';
import { drawWaterfall } from './waterfall-renderer';
import { sceneryProfiles, type SceneryProfile } from './profiles';
import { drawLandscapeLandmark } from './landmark-renderer';

function silhouette(ctx:CanvasRenderingContext2D,colour:string,points:readonly number[][]) {
  ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(0,700);
  for(const [x,y] of points)ctx.lineTo(x,y);
  ctx.lineTo(1000,700);ctx.closePath();ctx.fill();
}

function pine(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,colour:string) {
  ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(x,y-size);
  ctx.lineTo(x+size*.32,y);ctx.lineTo(x-size*.32,y);ctx.closePath();ctx.fill();
}

/** Mountains and the distant village deliberately have softer edges than playable surfaces. */
export function drawValleyLandscape(ctx:CanvasRenderingContext2D,frame:LivingFrame,profile:SceneryProfile=sceneryProfiles.bounce) {
  const sky=ctx.createLinearGradient(0,0,0,700);
  sky.addColorStop(0,profile.sky[0]);sky.addColorStop(.48,'#f6efd2');sky.addColorStop(1,profile.sky[1]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
  const sun=ctx.createRadialGradient(585,240,12,585,240,290);
  sun.addColorStop(0,'#fff8ce9e');sun.addColorStop(1,'#fff8ce00');ctx.fillStyle=sun;ctx.fillRect(0,0,1000,700);
  ctx.fillStyle='#fff7d4';ctx.beginPath();ctx.arc(...profile.sun,37,0,Math.PI*2);ctx.fill();

  const ridge=(points:number[][])=>points.map(([x,y],i)=>[i===0||i===points.length-1?x:x+profile.ridgeShift,y+profile.ridgeRise]);
  silhouette(ctx,profile.ridges[0],ridge([[0,356],[60,309],[125,345],[236,217],[320,306],[413,279],[532,377],[622,284],[710,324],[813,223],[905,304],[1000,265]]));
  silhouette(ctx,profile.ridges[1],ridge([[0,456],[95,377],[178,413],[273,354],[366,415],[483,382],[565,449],[701,367],[795,402],[915,340],[1000,391]]));
  // Atmospheric wash keeps distant silhouettes from competing with the puzzle.
  const haze=ctx.createLinearGradient(0,230,0,560);
  haze.addColorStop(0,'#f7f0dc00');haze.addColorStop(1,'#f7f0dcc9');ctx.fillStyle=haze;ctx.fillRect(0,220,1000,380);

  // The waterfall and village sit at the side/bottom edges, outside the main route.
  if(profile.feature==='waterfall') {
  silhouette(ctx,'#99b9a8',[[0,437],[30,412],[52,366],[112,347],[174,353],[194,410],[209,520],[258,581],[0,700]]);
  ctx.fillStyle='#c4d7bb';ctx.beginPath();ctx.moveTo(0,425);ctx.bezierCurveTo(38,420,63,344,128,351);
  ctx.lineTo(174,353);ctx.lineTo(170,367);ctx.bezierCurveTo(80,354,65,434,0,441);ctx.fill();
  ctx.strokeStyle='#c0e2d9';ctx.lineWidth=19;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,382);ctx.bezierCurveTo(38,388,71,353,137,358);ctx.stroke();
  ctx.fillStyle='#9bc3b6';ctx.beginPath();ctx.ellipse(158,sceneryLayout.waterfall.poolY,90,12,-.06,0,Math.PI*2);ctx.fill();
  drawWaterfall(ctx,frame);
  } else drawLandscapeLandmark(ctx,profile);
  for(const [x,y,s] of [[22,495,30],[61,506,19],[206,548,25],[929,541,32],[966,524,42],[992,555,26]])pine(ctx,x,y,s,'#82a58e');

  silhouette(ctx,profile.terrain,[[0,603],[92,585],[245,606],[379,573],[482,595],[639,562],[786,588],[931,564],[1000,594]]);
  for(const [x,y,w,h] of [[560,576,21,26],[588,582,27,21],[626,572,20,29],[664,579,24,24]]) {
    ctx.fillStyle='#e0ceb2';ctx.fillRect(x,y,w,h);ctx.fillStyle='#a48c77';
    ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+w/2,y-10);ctx.lineTo(x+w+3,y);ctx.closePath();ctx.fill();
    ctx.fillStyle='#7e9a91';ctx.fillRect(x+6,y+8,5,7);
  }
  ctx.strokeStyle='#b2a78d';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(0,sceneryLayout.roadY+2);ctx.lineTo(1000,sceneryLayout.roadY+2);ctx.stroke();
  ctx.strokeStyle='#f3e8c9';ctx.lineWidth=1.5;ctx.setLineDash([12,15]);ctx.beginPath();ctx.moveTo(0,sceneryLayout.roadY+3);ctx.lineTo(1000,sceneryLayout.roadY+3);ctx.stroke();ctx.setLineDash([]);
  // Lower foreground masks the distant road edge, clearly separating it from a collision platform.
  const grass=ctx.createLinearGradient(0,622,0,700);grass.addColorStop(0,'#cad4af');grass.addColorStop(1,'#e4e1c6');
  ctx.fillStyle=grass;ctx.fillRect(0,628,1000,72);
}
