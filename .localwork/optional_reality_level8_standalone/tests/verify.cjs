// Run with `node tests/verify.cjs`. No dependencies needed.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const context=new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get(o,k){return k in o?o[k]:noop;},set(o,k,v){o[k]=v;return true;}});
const elements=new Map();const document={
  getElementById(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',className:'',disabled:false,addEventListener:noop,getContext:()=>context});return elements.get(id);},
  querySelectorAll:()=>[],
  createElement:()=>{let content='';return {set textContent(v){content=v},get outerHTML(){return `<li>${content}</li>`}};}
};
const window={};vm.runInNewContext(source,{window,document,requestAnimationFrame:noop,console});const a=window.__optionalRealityTest;
function fill(commands){a.reset();for(const c of commands)assert.equal(a.applyCommand(c),true,`Cannot apply: ${c}`);}
function sim(){a.step(2881);return a.snapshot();}
const setup=['Set conveyor speed to 1.5','Set spring power to 2','Set fan power to 0.45','When the core touches the sensor, open the gate'];
// All fixtures are deterministic simulations with 120 Hz fixed stepping.
fill([]);let idle=sim();assert.equal(idle.won,false);assert.equal(idle.lost,true);assert.equal(idle.commandCount,0);console.log('PASS: idle factory times out without winning');
fill(setup);let won=sim();assert.equal(won.won,true);assert.equal(won.gateOpened,true);assert.ok(won.time<5);assert.equal(won.commandCount,4);console.log('PASS: four valid environment commands win in',won.time.toFixed(2),'simulated seconds');
fill(setup.slice(0,3));const locked=sim();assert.equal(locked.won,false);assert.equal(locked.gateOpened,false);console.log('PASS: gate remains locked without collision trigger');
fill([]);assert.equal(a.applyCommand('Teleport the core to the exit'),false);assert.equal(a.snapshot().commandCount,0);console.log('PASS: direct core manipulation rejected without charging quota');
fill([setup[0],setup[1]]);a.replay();assert.equal(a.snapshot().commandCount,2);assert.equal(a.snapshot().ball.x,160);assert.equal(a.snapshot().time,0);console.log('PASS: replay resets only the run');
fill(setup);a.reset();assert.equal(a.snapshot().commandCount,0);console.log('PASS: reset clears environment, history and quota');
// check all command types with allowed ranges
fill(['Set gravity to 0.9','Set the platform bounce to 0.7','Set the floor friction to 0.2','Make the wheel spin clockwise at speed 1']);
assert.equal(a.snapshot().env.gravity,0.9);assert.equal(a.snapshot().env.bounce,0.7);assert.equal(a.snapshot().env.friction,0.2);assert.equal(a.snapshot().env.wheel,1);
assert.equal(a.applyCommand('Set fan power to 999'),false);assert.equal(a.snapshot().commandCount,4);console.log('PASS: gravity, bounce, friction, rotation and range validation');
console.log('ALL SIMULATION CHECKS PASSED');
