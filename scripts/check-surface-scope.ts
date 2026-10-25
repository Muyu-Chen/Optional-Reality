import {config as dotenv} from 'dotenv';
import {writeFile,mkdir} from 'node:fs/promises';
import {compileRules} from '../server/src/compiler';
import {loadConfig} from '../server/src/config';
import {findLevel} from '../client/src/levels/catalog';
import {initialRules} from '../client/src/levels/rules';
import {normalizeAccelerationOperation} from '../shared/acceleration';
dotenv({quiet:true});const config=loadConfig(process.env);
const set=(target:string,property:string,value:number)=>({type:'set_property',target,property,value});
const canonical=(ops:any[])=>ops.map(normalizeAccelerationOperation).map(op=>JSON.stringify(op,Object.keys(op).sort())).sort().join('|');
const reports:any[]=[];
for(const id of ['bounce','multi-bounce','catch-cup']){
 const level=findLevel(id)!;const first=id==='bounce'?'bounce-floor':id==='multi-bounce'?'first-pad':'launch-pad';
 const second=id==='multi-bounce'?'second-pad':id==='catch-cup'?'cup-base':first;
 const cases=[
  ['Make all the surfaces bouncy with a restitution of 0.8.',[set('world','restitution',.8)]],
  ['把所有表面的全局摩擦系数设置成0.3。',[set('world','friction',.3)]],
  ['Double all surface friction.',[{type:'scale_property',target:'world',property:'friction',factor:2}]],
  [`Set ${first} restitution to 0.2.`,[set(first,'restitution',.2)]],
  [`Set global bounce to 0.8, but ${first} bounce to 0.1.`,[set('world','restitution',.8),set(first,'restitution',.1)]],
  [`Set ${first} friction to 0.4.`,[set(first,'friction',.4)]],
  ['Set the global surface restitution to 0.7; leave individual overrides alone.',[set('world','restitution',.7)]],
  [first===second?`Set ${first} bounce to 0.6.`:`Set both ${first} and ${second} restitution to 0.6.`,first===second?[set(first,'restitution',.6)]:[set(first,'restitution',.6),set(second,'restitution',.6)]],
 ] as const;
 for(let round=1;round<=3;round++){
  const rules=initialRules(level);rules.values[first]={...rules.values[first],restitution:.4};
  const request={requestId:crypto.randomUUID(),levelId:id,sceneVersion:1,queueRevision:1,rules,messages:cases.map(([text],i)=>({id:'m'+i,text}))};
  try{const output=await compileRules(request,config);const failures=output.messages.flatMap((msg,i)=>canonical(msg.operations)===canonical([...cases[i][1]])?[]:[{text:cases[i][0],expected:cases[i][1],actual:msg.operations}]);reports.push({level:id,round,cases:cases.length,passed:cases.length-failures.length,failures});}
  catch(error){reports.push({level:id,round,cases:cases.length,passed:0,error:error instanceof Error?error.message:'failed'});}
  console.log(JSON.stringify(reports.at(-1)));
 }
 try{await compileRules({requestId:crypto.randomUUID(),levelId:id,sceneVersion:1,queueRevision:1,rules:initialRules(level),messages:[{id:'unknown',text:'Set the moon pad bounce to 0.6.'}]},config);reports.push({level:id,cases:1,passed:0,error:'Unknown surface was accepted.'});}
 catch(error){reports.push({level:id,cases:1,passed:/^Message \d+:/.test(error instanceof Error?error.message:'')?1:0});}
}
await mkdir('.localwork/surface-scope',{recursive:true});await writeFile('.localwork/surface-scope/report.json',JSON.stringify(reports,null,2),{mode:0o600});
const total=reports.reduce((sum,r)=>sum+r.cases,0),passed=reports.reduce((sum,r)=>sum+r.passed,0);console.log(JSON.stringify({total,passed}));if(total!==passed)process.exitCode=1;
