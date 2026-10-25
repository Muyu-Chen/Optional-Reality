// Fixed orthographic projection. All meshes and particles are local Canvas geometry.
// Vehicle positions come exclusively from simulation.js; visual damage is cosmetic.
export function createRenderer(canvas,reducedMotion=false){
 const c=canvas.getContext('2d');let w=0,h=0,s=1,cx=0,cy=0,particles=[],seen=null,smokeClock=0;
 const P=(x,y,z=0)=>[cx+(x+z*.44)*s,cy+(z*.39-x*.065-y)*s];
 function poly(points,fill,stroke){c.beginPath();points.forEach((v,i)=>{const p=P(...v);i?c.lineTo(...p):c.moveTo(...p);});c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}}
 function line(points,color,width=1){c.beginPath();points.forEach((v,i)=>i?c.lineTo(...P(...v)):c.moveTo(...P(...v)));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function box(x,y,z,a,b,d,colors){
  const [side,top,front]=colors;
  poly([[x,y,z+d],[x+a,y,z+d],[x+a,y+b,z+d],[x,y+b,z+d]],side,'#101a1a70');
  poly([[x+a,y,z],[x+a,y,z+d],[x+a,y+b,z+d],[x+a,y+b,z]],front||side);
  poly([[x,y+b,z],[x+a,y+b,z],[x+a,y+b,z+d],[x,y+b,z+d]],top);
 }
 function ring(x,y,z,r,fill,stroke,width=1,plane='xy'){
  const points=Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return plane==='xy'?[x+Math.cos(a)*r,y+Math.sin(a)*r,z]:[x,y+Math.sin(a)*r,z+Math.cos(a)*r];});
  c.beginPath();points.forEach((v,i)=>i?c.lineTo(...P(...v)):c.moveTo(...P(...v)));if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
 }
 function wheel(x,z,spin,r=.49){
  ring(x,.53,z,r,'#121c1d','#394443',2);ring(x,.53,z+.02,r*.75,'#253333','#b49b6a',1.3);ring(x,.53,z+.03,.12,'#b7a073');
  for(let i=0;i<8;i++){const a=i*Math.PI/4+spin;line([[x,.53,z+.04],[x+Math.cos(a)*r*.7,.53+Math.sin(a)*r*.7,z+.04]],'#8c8065',1.6);}
 }
 function car(car,index,time){
  const x=car.x,sign=car.heading,green=index===0;
  const body=green?'#3d5951':'#713e35',light=green?'#698174':'#9b6150',dark=green?'#273f39':'#4c2e2a';
  const T=(a,b,z)=>[x+a*sign,b,z];
  function B(a,b,z,ww,hh,dd,col){box(x+(sign>0?a:-a-ww),b,z,ww,hh,dd,col);}
  function L(v,col,width=1){line(v.map(p=>T(...p)),col,width);}
  // Ground shadow and dim reflection on damp stone.
  poly([[x-2.7,.005,-1.15],[x+2.6,.005,-1.15],[x+3.1,.005,1.35],[x-2.4,.005,1.35]],'#090f1299');
  wheel(x-1.45,-.94,time*car.v*.3);wheel(x+1.4,-.94,time*car.v*.3);
  B(-2.25,.5,-.9,4.5,.22,1.8,['#222e2c','#5d6150','#283531']);
  B(-2,.75,-.8,2.05,.43,1.6,[body,light,dark]);
  B(-1.9,1.18,-.76,.42,.68,1.52,[dark,body,dark]);
  // Bench, cockpit frame and clear windscreen.
  B(-1.57,1.19,-.68,.75,.17,1.36,['#45352c','#76604a','#3b3029']);
  B(-1.87,1.9,-.9,1.9,.16,1.8,[dark,light,body]);
  for(const z of [-.78,.78]){L([[-1.8,1.2,z],[-1.8,1.9,z]],'#b9a077',2);L([[-.16,1.16,z],[-.16,1.9,z]],'#b9a077',2);}
  poly([T(-.16,1.2,-.76),T(-.16,1.9,-.76),T(-.16,1.9,.76),T(-.16,1.2,.76)],'#b9d3c023','#a8b9a43b');
  // Boiler: faceted cylinder along the vehicle's length with brass bands.
  const front=2.04-car.damage*.28;
  for(let i=0;i<12;i++){
   const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2;
   const shade=['#8f7650','#b49b65','#b49b65','#9c875a','#647261','#4b6557','#354d42','#2b4138','#293e37','#435746','#627257','#927d53'][i];
   poly([T(.08,1.19+Math.sin(a)*.51,Math.cos(a)*.62),T(front,1.19+Math.sin(a)*.51,Math.cos(a)*.62),T(front,1.19+Math.sin(b)*.51,Math.cos(b)*.62),T(.08,1.19+Math.sin(b)*.51,Math.cos(b)*.62)],shade);
  }
  for(const a of [.3,1.5]){const pts=Array.from({length:25},(_,i)=>T(a,1.19+Math.sin(i/24*Math.PI*2)*.52,Math.cos(i/24*Math.PI*2)*.63));line(pts,'#ccb17b',2);}
  ring(x+front*sign,1.19,0,.51,'#34433b','#a08d65',1.7,'yz');
  B(.55,1.62,-.15,.36,.77,.3,['#293c34','#a08a60','#445547']);
  B(.48,2.36,-.21,.5,.1,.42,['#273a33','#c3a26e','#6b7154']);
  // Pipework, tread and buffers.
  B(-2.32,.69,.87,4.55,.09,.24,['#796e50','#a38a60','#5c5944']);
  L([[.2,.93,.8],[1.8,.93,.8],[1.8,1.34,.8]],'#bda16a',2);
  for(const z of [-.68,.68]){B(2.12,1,z-.09,.26,.14,.18,['#817658','#cbb580','#7c7253']);const p=P(...T(2.24,1.09,z));c.fillStyle='#ffe6ac';c.shadowColor='#f5cd76';c.shadowBlur=9;c.beginPath();c.arc(...p,2.2,0,7);c.fill();c.shadowBlur=0;}
  B(2.25-car.damage*.3,.68,-.85,.15,.21,1.7,['#414a3d','#b19c74','#676954']);
  wheel(x-1.45,1.03,-x*sign*.8);wheel(x+1.4,1.03,-x*sign*.8);
  L([[-1.45,.53,1.12],[1.4,.53,1.12]],'#a5a085',2.5);
  const plaque=P(...T(-1.25,1.03,.82));c.font=`${Math.max(8,s*.18)}px Georgia`;c.fillStyle='#cab486';c.fillText(green?'01':'02',...plaque);
 }
 function background(time){
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#17272b');sky.addColorStop(.45,'#536057');sky.addColorStop(.7,'#657062');sky.addColorStop(1,'#172225');c.fillStyle=sky;c.fillRect(0,0,w,h);
  const light=c.createRadialGradient(w*.63,h*.35,10,w*.63,h*.35,w*.6);light.addColorStop(0,'#cab28230');light.addColorStop(1,'#c7ad7600');c.fillStyle=light;c.fillRect(0,0,w,h);
  // Distant industrial silhouettes remain scenery, not invisible collision bodies.
  for(let i=0;i<11;i++){
   const bx=-34+i*6.4,bh=2.8+Math.sin(i*5)*1.2;
   box(bx,0,-17,5,bh,3,['#30433f','#3a4c44','#35463f']);
   for(let j=0;j<4;j++){const p=P(bx+.6+j,1.2,-13.96);c.fillStyle='#ad956333';c.fillRect(p[0],p[1],s*.17,s*.32);}
   if(i%3===0)box(bx+2,bh,-16,.7,3.8,.7,['#35453e','#485249','#2f403b']);
  }
  poly([[-45,0,-8],[45,0,-8],[45,0,10],[-45,0,10]],'#33403b');
  poly([[-45,.012,-2.7],[45,.012,-2.7],[45,.012,2.7],[-45,.012,2.7]],'#4a5147');
  line([[-45,.02,-2.7],[45,.02,-2.7]],'#8c927655',2);line([[-45,.02,2.7],[45,.02,2.7]],'#89907866',2);
  // Cobble joints / puddles.
  for(let x=-40;x<41;x+=2){for(let z=-2.4;z<2.5;z+=.8){line([[x+(z%1)*.7,.025,z],[x+1.75+(z%1)*.7,.025,z]],'#8b947321',.7);line([[x,.025,z],[x,.025,z+.7]],'#182b292e',.7);}}
  for(let i=0;i<13;i++){const x=-25+i*4.3,z=(i%2?1:-1)*1.7;poly([[x,.03,z],[x+2.4,.03,z],[x+2,.03,z+.3],[x-.3,.03,z+.25]],'#9ca78b16');}
  for(const x of [-22,-10,10,22]){
   box(x,0,-4,.12,5.2,.12,['#283c37','#8e8766','#3e4c3d']);line([[x,5.1,-4],[x+.7,5.1,-4],[x+.7,4.85,-4]],'#263b35',2);
   const p=P(x+.7,4.8,-4);const g=c.createRadialGradient(...p,0,...p,s*2.5);g.addColorStop(0,'#e5c08135');g.addColorStop(1,'#e5c08100');c.fillStyle=g;c.fillRect(p[0]-s*3,p[1]-s*3,s*6,s*6);c.fillStyle='#e9c88e';c.fillRect(p[0]-2,p[1]-2,4,5);
  }
  // Neutral meeting mark.
  line([[0,.04,-2.1],[0,.04,2.1]],'#cfbb883b',1);const p=P(0,.04,3.1);c.font='9px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#bec19b77';c.fillText('THE MEETING POINT',...p);c.textAlign='left';
 }
 function impact(event){
  if(seen===event)return;seen=event;
  const intensity=Math.min(1,event.speed/15),count=reducedMotion?12:Math.round(35+intensity*155);
  let seed=941;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<count;i++){const spark=i%4!==0;
   particles.push({x:event.x,y:.85,z:(random()-.5)*1.5,vx:(random()-.5)*(4+event.speed*.8),vy:2+random()*(2+event.speed*.5),vz:(random()-.5)*(3+event.speed*.45),life:spark?.45+random()*.9:1.5+random(),age:0,spark,size:spark?.025:.08+random()*.13,shade:random()});
  }
  for(let i=0;i<(reducedMotion?6:20);i++)particles.push({x:event.x,y:1.2,z:(Math.random()-.5),vx:(Math.random()-.5)*3,vy:1+Math.random()*2,vz:Math.random()-.5,life:2.7,age:0,smoke:true,size:.15+Math.random()*.2});
 }
 function update(world,dt){
  if(world.impact)impact(world.impact);
  if(world.running){smokeClock+=dt;while(smokeClock>.075){smokeClock-=.075;for(const car of world.cars)particles.push({x:car.x+.75*car.heading,y:2.5,z:0,vx:-car.v*.07,vy:.7+world.rules.pressure*.35,vz:-.18,life:2.1,age:0,smoke:true,size:.12});}}
  particles=particles.filter(p=>p.age<p.life).slice(-500);
  for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(!p.smoke){p.vy-=9.81*dt;if(p.y<.08){p.y=.08;p.vy=Math.abs(p.vy)*.25;p.vx*=.85;p.vz*=.85;}}}
 }
 function draw(world){
  const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  c.setTransform(dpr,0,0,dpr,0,0);s=Math.min(w/39,h/19);cx=w*.5;cy=h*(w<650?.48:.57);
  const since=world.impact?world.time-world.impact.time:9;const kick=!reducedMotion&&since<.35?Math.min(6,world.impact.speed*.35)*(1-since/.35):0;
  c.save();c.translate(Math.sin(since*92)*kick,Math.cos(since*113)*kick*.6);background(world.time);
  for(let i=0;i<2;i++)car(world.cars[i],i,world.time);
  for(const p of particles){const alpha=Math.max(0,1-p.age/p.life),pos=P(p.x,p.y,p.z);c.globalAlpha=alpha;
   if(p.smoke){const size=(p.size+p.age*.25)*s,g=c.createRadialGradient(...pos,0,...pos,size);g.addColorStop(0,'#c5cbbc35');g.addColorStop(1,'#c5cbbc00');c.fillStyle=g;c.beginPath();c.arc(...pos,size,0,7);c.fill();}
   else if(p.spark){const end=P(p.x-p.vx*.025,p.y-p.vy*.025,p.z-p.vz*.025);c.strokeStyle=p.shade>.5?'#ffdc8a':'#f39342';c.lineWidth=1.3;c.beginPath();c.moveTo(...end);c.lineTo(...pos);c.stroke();}
   else{c.fillStyle=p.shade>.5?'#9c8b61':'#536455';c.save();c.translate(...pos);c.rotate(p.age*p.vx);c.fillRect(-p.size*s/2,-p.size*s/2,p.size*s,p.size*s*.6);c.restore();}
  }c.globalAlpha=1;c.restore();
  if(!reducedMotion&&since<.1&&world.impact.speed>4){c.fillStyle=`rgba(255,226,167,${(1-since/.1)*.3})`;c.fillRect(0,0,w,h);}
 }
 return {draw,update,reset(){particles=[];seen=null;smokeClock=0;}};
}
