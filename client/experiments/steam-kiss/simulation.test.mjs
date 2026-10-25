import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,applyRule,parseRule,gapOf} from './simulation.js';
function run(world,action=()=>{}){world.running=true;for(let i=0;i<4000&&!world.ended;i++){action(world);stepWorld(world);}return world;}
test('default pressure causes a real collision; contact energy matches the reduced mass',()=>{
 const w=run(createWorld());assert.equal(w.result,'crash');assert.ok(w.impact.speed>8);assert.ok(Math.abs(w.impact.energy-450*w.impact.speed**2)<1e-8);assert.ok(gapOf(w)>=0);
});
test('timed braking gives a gentle stable kiss, early and late braking give distinct outcomes',()=>{
 for(const [time,result] of [[0,'stopped'],[2.525,'kiss'],[2.535,'kiss'],[3,'crash']]){
  let applied=false;const w=run(createWorld(),w=>{if(w.time>=time&&!applied){applyRule(w,'Set brake force to 0.35');applied=true;}});
  assert.equal(w.result,result,`brake at ${time}`);if(result==='kiss'){assert.ok(w.impact.speed<=2.4);assert.ok(gapOf(w)<.18);}
 }
});
test('slippery ground reduces braking and changes the outcome',()=>{
 const stop=createWorld();applyRule(stop,'Set brake force to 1');run(stop);assert.equal(stop.result,'stopped');
 const slide=createWorld();applyRule(slide,'Set brake force to 1');applyRule(slide,'Set road friction to 0.05');run(slide);assert.equal(slide.result,'crash');
});
test('elasticity changes rebound; symmetric momentum remains zero',()=>{
 const soft=run(createWorld({bounce:0})),elastic=run(createWorld({bounce:.85}));
 assert.ok(Math.abs(elastic.cars[0].v)>Math.abs(soft.cars[0].v));assert.ok(Math.abs(elastic.cars[0].v+elastic.cars[1].v)<1e-8);
});
test('paused time freezes; retry starts fresh while the input rule object stays unchanged',()=>{
 const w=createWorld();stepWorld(w);assert.equal(w.time,0);applyRule(w,'Set road friction to 0.5');const retry=createWorld(w.rules);retry.rules.friction=.2;assert.equal(w.rules.friction,.5);assert.equal(retry.time,0);
});
test('unsupported, compound, non-finite and protected-target commands never mutate the world',()=>{
 const w=createWorld(),before=JSON.stringify(w);
 for(const text of ['Set car speed to 10','teleport car to 0','Set steam pressure to Infinity','Set brake force to 999','Set brake force to 0.5 and road friction to 0','请让两辆车直接停住'])assert.throws(()=>applyRule(w,text));
 assert.equal(JSON.stringify(w),before);assert.deepEqual(parseRule('摩擦力 0.05'),{field:'friction',value:.05});
});
