import type { AmbientBird } from './ambient-bird-flight';

export function ambientBirdPose(bird:AmbientBird,reducedMotion=false) {
  const eagle=bird.kind==='eagle',roll=bird.liftAngle+Math.PI/2;
  const flap=reducedMotion?0:eagle
    ?Math.max(0,Math.cos(bird.wingPhase))**16*Math.sin(bird.wingPhase*4)*(.3+.2*bird.effort)
    :Math.sin(bird.wingPhase)*(.15+.55*bird.effort);
  return {
    span:eagle?8*1.8:4.2*1.6,
    flap,
    bank:roll+Math.sin(bird.heading-roll)*.24,
    facing:Math.cos(bird.heading-roll),
  };
}

function wings(ctx:CanvasRenderingContext2D,span:number,flap:number,eagle:boolean) {
  const tip=-span*(.3+flap),width=eagle?.2:.13;
  ctx.beginPath();ctx.moveTo(0,span*.16);
  for(const side of [-1,1]) {
    ctx.quadraticCurveTo(side*span*.22,-span*.2,side*span*.55,tip);
    ctx.quadraticCurveTo(side*span*.82,tip-span*.05,side*span,tip+span*.08);
    ctx.quadraticCurveTo(side*span*.72,tip+span*width,side*span*.4,span*.04);
    ctx.quadraticCurveTo(side*span*.2,span*.23,0,span*.16);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  if(eagle) {
    // Three short primary feathers, readable at the eagle's larger scale.
    for(const side of [-1,1])for(let i=0;i<3;i++) {
      ctx.beginPath();ctx.moveTo(side*span*(.78+i*.07),tip+span*(.09+i*.01));
      ctx.lineTo(side*span*(.84+i*.07),tip+span*(.15+i*.025));ctx.stroke();
    }
  }
}

export function drawAmbientBird(ctx:CanvasRenderingContext2D,bird:AmbientBird,x:number,y:number,scale:number,reducedMotion:boolean) {
  const eagle=bird.kind==='eagle',pose=ambientBirdPose(bird,reducedMotion),span=pose.span*scale;
  ctx.save();ctx.translate(x,y);ctx.rotate(pose.bank);
  ctx.fillStyle=eagle?'#53665b99':'#5c7e7199';
  ctx.strokeStyle=eagle?'#42594d9e':'#486e608c';
  ctx.lineWidth=(eagle?.85:.75)*scale;ctx.lineCap='round';ctx.lineJoin='round';
  wings(ctx,span,pose.flap,eagle);
  // A tapered body, small head and beak distinguish the silhouettes from an M.
  ctx.beginPath();ctx.ellipse(0,span*.1,span*(eagle?.13:.115),span*.31,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(pose.facing*span*.04,-span*.2,span*.13,span*.13,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(pose.facing*span*.10,-span*.25);
  ctx.lineTo(pose.facing*span*.30,-span*.19);ctx.lineTo(pose.facing*span*.10,-span*.13);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-span*.07,span*.28);
  ctx.lineTo(-span*(eagle?.2:.15),span*.57);ctx.lineTo(0,span*(eagle?.5:.42));
  ctx.lineTo(span*(eagle?.2:.15),span*.57);ctx.lineTo(span*.07,span*.28);ctx.closePath();ctx.fill();
  ctx.restore();
}
