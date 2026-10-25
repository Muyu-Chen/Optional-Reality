// A one-dimensional rigid-body experiment in metres, kilograms and seconds.
// Rendering adds depth but never changes a vehicle's simulated trajectory.
export const STEP = 1 / 120;
export const DEFAULT_RULES = Object.freeze({pressure:1, friction:.7, brake:0, bounce:.12});
export const LIMITS = Object.freeze({pressure:[0,3],friction:[0,1.5],brake:[0,1],bounce:[0,1]});
const HALF_LENGTH = 2.4;
const MASS = 1800;

export function parseRule(input) {
 const text=input.trim().toLowerCase();
 const number=text.match(/-?\d+(?:\.\d+)?/g);
 if(!number || number.length!==1)throw new Error('请指定一个数值，例如 Set brake force to 0.35。');
 if(/teleport|position|velocity|car speed|mass|传送|位置|车速|质量/.test(text))throw new Error('汽车本身受到保护。请修改路面摩擦、制动、蒸汽压力或碰撞弹性。');
 const fields=[['pressure',/^(?:set (?:the )?steam pressure(?: to)?|蒸汽压力|锅炉压力)\s*[:：=]?\s*-?\d+(?:\.\d+)?\s*(?:bar)?$/],['friction',/^(?:set (?:the )?road friction(?: to)?|路面摩擦|摩擦力)\s*[:：=]?\s*-?\d+(?:\.\d+)?$/],['brake',/^(?:set (?:the )?brake force(?: to)?|制动力|制动强度)\s*[:：=]?\s*-?\d+(?:\.\d+)?$/],['bounce',/^(?:set (?:the )?collision elasticity(?: to)?|碰撞弹性|弹性)\s*[:：=]?\s*-?\d+(?:\.\d+)?$/]];
 const field=fields.find(([,pattern])=>pattern.test(text))?.[0];
 if(!field)throw new Error('暂不支持这条规则。点选一张配方，可以修改里面的数值。');
 const value=Number(number[0]),[min,max]=LIMITS[field];
 if(!Number.isFinite(value)||value<min||value>max)throw new Error(`数值范围是 ${min}–${max}，本次未修改世界。`);
 return {field,value};
}

export function createWorld(rules=DEFAULT_RULES) {
 const checked={...DEFAULT_RULES,...rules};
 for(const [key,[lo,hi]] of Object.entries(LIMITS))if(!Number.isFinite(checked[key])||checked[key]<lo||checked[key]>hi)throw new Error('Invalid initial rules.');
 return {rules:checked,cars:[{x:-14,v:2,heading:1,mass:MASS,damage:0},{x:14,v:-2,heading:-1,mass:MASS,damage:0}],time:0,tick:0,running:false,ended:false,result:null,impact:null,events:[],contact:false,settle:0,commands:0};
}
export const gapOf = world => Math.max(0,world.cars[1].x-world.cars[0].x-2*HALF_LENGTH);
export const closingSpeed = world => Math.max(0,world.cars[0].v-world.cars[1].v);
export function applyRule(world,input) {
 if(world.ended)throw new Error('这一轮已结束。请重试后再应用规则。');
 if(world.commands>=100)throw new Error('已使用 100 次规则，请恢复初始规则。');
 const rule=parseRule(input);
 world.rules[rule.field]=rule.value;world.commands++;
 world.events.push({kind:'rule',...rule,time:world.time});
 return rule;
}
function finish(world,result) {world.result=result;world.running=false;world.ended=true;}
export function stepWorld(world,dt=STEP) {
 if(!world.running||world.ended)return;
 if(!Number.isFinite(dt)||dt<=0||dt>STEP*1.01)throw new Error('Use the fixed simulation step.');
 world.time+=dt;world.tick++;
 for(const car of world.cars){
  // Pressure supplies traction. Braking is friction limited; static friction can hold.
  const drive=world.impact?0:1350*world.rules.pressure*car.heading;
  const brake=world.rules.brake*world.rules.friction*car.mass*9.81;
  const drag=45+2.5*car.v*car.v;
  const resistance=brake+drag;
  if(Math.abs(car.v)<.025&&Math.abs(drive)<=resistance)car.v=0;
  else {
   const sign=Math.abs(car.v)>.001?Math.sign(car.v):Math.sign(drive);
   const next=car.v+(drive-sign*resistance)/car.mass*dt;
   car.v=car.v*next<0 && Math.abs(drive)<=resistance?0:next;
  }
  car.x+=car.v*dt;
 }
 const [a,b]=world.cars;
 const penetration=2*HALF_LENGTH-(b.x-a.x);
 if(penetration>=0){
  const speed=a.v-b.v;
  a.x-=penetration/2;b.x+=penetration/2;
  if(speed>0){
   const impulse=(1+world.rules.bounce)*speed/(1/a.mass+1/b.mass);
   a.v-=impulse/a.mass;b.v+=impulse/b.mass;
   if(!world.impact){
    const reducedMass=a.mass*b.mass/(a.mass+b.mass);
    world.impact={speed,energy:.5*reducedMass*speed*speed,time:world.time,x:(a.x+b.x)/2,elasticity:world.rules.bounce};
    world.events.push({kind:'impact',...world.impact});
    const damage=Math.max(0,Math.min(1,(speed-2)/14));a.damage=b.damage=damage;
   }
  }
  world.contact=true;
 }else world.contact=false;
 if(world.impact){
  const elapsed=world.time-world.impact.time;
  if(world.impact.speed<=2.4){
   world.settle=gapOf(world)<=.18&&closingSpeed(world)<.2&&Math.max(Math.abs(a.v),Math.abs(b.v))<.25?world.settle+dt:0;
   if(world.settle>=.45)finish(world,'kiss');
   else if(elapsed>3.5)finish(world,'rebound');
  }else if(elapsed>=3.2)finish(world,world.impact.speed<4?'bump':'crash');
 }else if(world.time>1&&Math.abs(a.v)<.025&&Math.abs(b.v)<.025&&gapOf(world)>.02)finish(world,'stopped');
 if(!world.ended&&world.time>=30)finish(world,'timeout');
}
