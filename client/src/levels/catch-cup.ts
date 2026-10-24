import type { LevelDefinition } from './types';

export const catchCup: LevelDefinition = {
  id:'catch-cup',number:2,stage:4,title:'Catch, Don’t Bounce',
  viewport:{width:800,height:510,pixelsPerMetre:80},timeLimitSeconds:30,initialGravity:2,failOnFall:true,

  environment:{restitution:0,friction:0},
  ball:{id:'ball-A',label:'BALL A',position:[100,110],velocity:[1.25,0],radius:16,restitution:0},
  tracks:[
    {id:'launch-pad',label:'Launch pad',aliases:['launch pad','发射板'],points:[[40,427],[350,427]],thickness:14,feature:'bounce',material:{restitution:.1}},
    {id:'cup-base',label:'Cup base',aliases:['cup','cup base','杯底','接球杯'],points:[[500,280],[750,280]],thickness:12,feature:'bounce',material:{restitution:1.05,friction:.5}},
    {id:'cup-left',label:'Left cup wall',points:[[500,145],[500,280]],thickness:10,material:{restitution:0,friction:.3},preset:true},
    {id:'cup-right',label:'Right cup wall',points:[[750,145],[750,280]],thickness:10,material:{restitution:0,friction:.3},preset:true},
  ],
  guideLines:[],exit:{id:'cup',label:'CATCH',x:505,y:140,width:240,height:136,condition:{kind:'settle',seconds:.8,maxSpeed:.15}},
  instructions:{
    objective:'Launch high, then let the cup keep the ball',
    hint:'Send launch pad bounce 1.1 to start. While the ball flies, send cup bounce 0 before it lands inside. Stay still in the cup for 0.8 seconds. The two blue surfaces have separate rules.',
    sceneDescription:'A protected ball moves right, falls onto launch-pad (Launch pad, 发射板), then flies toward a raised open cup. cup-base (Cup base, cup, 杯底, 接球杯) is initially very bouncy. Gravity, horizontal acceleration, restitution and friction are editable. Launch pad and cup base have independent local material overrides; global surface values are defaults and do not replace local overrides. The gray cup walls are preset. The green cup interior requires complete containment and speed at most 0.15 m/s for 0.8 seconds. Falling below the red boundary fails.',
    canvasHeading:'BOUNCE TO ARRIVE. SOFTEN TO STAY.',readyCaption:'TWO BLUE SURFACES. TWO DIFFERENT JOBS.',
    exampleMessages:['Set launch pad bounce to 1.1','Set cup bounce to 0'],
    suggestedMessages:['Set launch pad bounce to 1.1','Set cup bounce to 0'],
    exampleNotice:'Send the launch-pad rule first, then soften the cup during the flight. The ball must settle inside.',
  },
};
