import { distantStars } from './layout';
import { sceneryProfiles, type SceneryProfile } from './profiles';

export function drawCosmosLandscape(ctx:CanvasRenderingContext2D,profile:SceneryProfile=sceneryProfiles['gravity-lab']) {
  const sky=ctx.createLinearGradient(0,0,1000,700);
  sky.addColorStop(0,profile.sky[0]);sky.addColorStop(.42,'#ddd8e7');sky.addColorStop(1,profile.sky[1]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
  const nebula=ctx.createRadialGradient(400,330,30,400,330,600);
  nebula.addColorStop(0,'#f9efdfe8');nebula.addColorStop(.5,'#e9dfedaa');nebula.addColorStop(1,'#747aab00');
  ctx.fillStyle=nebula;ctx.fillRect(0,0,1000,700);
  // Distant stellar dust is stationary; it does not become a false collision surface.
  for(const star of distantStars) {
    ctx.fillStyle=star.radius>2?'#fffbed':'#fffdf3b8';ctx.beginPath();ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);ctx.fill();
  }
  ctx.save();ctx.translate(profile.planet[0],profile.planet[1]);ctx.rotate(profile.feature==='nebula'?.35:-.3);
  ctx.strokeStyle='#d1bfc8';ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(0,0,89,18,0,0,Math.PI*2);ctx.stroke();
  const planet=ctx.createLinearGradient(-33,-30,37,40);planet.addColorStop(0,profile.planet[2]);planet.addColorStop(1,profile.planet[3]);
  ctx.fillStyle=planet;ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e8d8d4';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,89,18,0,0,Math.PI);ctx.stroke();ctx.restore();
  if(profile.feature==='nebula') {
    ctx.strokeStyle='#fff2e27a';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(663,310);ctx.bezierCurveTo(720,267,813,246,971,261);ctx.stroke();
    ctx.fillStyle='#fff7e7';ctx.beginPath();ctx.arc(668,308,5,0,Math.PI*2);ctx.fill();
  }
  // A small moon and floating rock silhouettes frame the margins of the playground.
  const moon=ctx.createLinearGradient(0,475,0,645);moon.addColorStop(0,'#a8b7c9');moon.addColorStop(1,'#c8cbd4');
  ctx.fillStyle=moon;ctx.beginPath();ctx.arc(-20,631,159,-Math.PI/2,Math.PI/2);ctx.fill();
  ctx.fillStyle='#9baec41f';for(const [x,y,r] of [[35,526,19],[95,601,27],[17,646,16]]){ctx.beginPath();ctx.ellipse(x,y,r,r*.65,-.4,0,Math.PI*2);ctx.fill();}
  for(const [x,y,size] of [[259,627,27],[708,589,19],[951,499,25]]) {
    ctx.save();ctx.translate(x,y);ctx.rotate(x*.01);ctx.fillStyle='#aeb7c7';ctx.beginPath();
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=size*(i%2?.8:1);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.6):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.6);}
    ctx.closePath();ctx.fill();ctx.fillStyle='#cad0d7';ctx.beginPath();ctx.ellipse(-3,-3,size*.27,size*.13,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}
