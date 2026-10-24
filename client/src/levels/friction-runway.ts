import type { LevelDefinition } from './types';

export const frictionRunway: LevelDefinition = {
  id:'friction-runway',number:2,stage:3,title:'Brake Before the Edge',
  viewport:{width:800,height:510,pixelsPerMetre:80},timeLimitSeconds:30,initialGravity:2,failOnFall:true,openEdges:['right'],

  environment:{restitution:0,friction:0},
  ball:{id:'slider',label:'SLIDING BLOCK',position:[100,377],velocity:[2,0],radius:16,restitution:0,shape:{kind:'box',width:32,height:32}},
  tracks:[{id:'runway',label:'Runway',aliases:['runway','跑道'],points:[[40,400],[700,400]],thickness:14,feature:'friction'}],
  guideLines:[],
  exit:{id:'parking-bay',label:'PARK HERE',x:400,y:345,width:240,height:50,condition:{kind:'settle',seconds:.75,maxSpeed:.12}},
  instructions:{
    objective:'Stop the whole block inside the green bay',
    hint:'Send friction 0 to start sliding. Once the whole block is inside the green bay, send friction 0.3. Hold still for 0.75 seconds. Braking too early stops short; too late and it falls.',
    sceneDescription:'A protected non-rotating sliding block (slider), not a rolling ball, starts moving right on a teal runway. runway inherits world surface properties. Gravity, horizontal acceleration, surface restitution and friction are editable. A wide green parking bay spans x=400..640; the entire block must stay inside at speed at most 0.12 m/s for 0.75 simulated seconds. The runway ends at x=700 with an open drop. No direct block movement or velocity edits.',
    canvasHeading:'LESS SLIDE. MORE CONTROL.',readyCaption:'THE GREEN BAY IS A STOP, NOT A CHECKPOINT.',
    exampleMessages:['Set surface friction to 0','Set surface friction to 0.3'],
    suggestedMessages:['Set surface friction to 0','Set surface friction to 0.3'],
    exampleNotice:'Send friction 0 to begin; send 0.3 when the whole block reaches the green bay.',
  },
};
