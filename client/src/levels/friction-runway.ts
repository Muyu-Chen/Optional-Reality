import type { LevelDefinition } from './types';

export const frictionRunway: LevelDefinition = {
  id:'friction-runway',number:2,stage:3,title:'Brake Before the Edge',
  viewport:{width:800,height:510,pixelsPerMetre:80},timeLimitSeconds:30,initialAcceleration:[0,2],

  environment:{restitution:0,friction:0},
  ball:{id:'slider',label:'SLIDING BLOCK',position:[100,377],velocity:[2,0],radius:16,restitution:0,shape:{kind:'box',width:32,height:32}},
  tracks:[{id:'runway',label:'Grip surface',aliases:['grip','friction pad','摩擦表面','摩擦板','runway','跑道'],points:[[40,400],[760,400]],thickness:14,feature:'friction'}],
  guideLines:[],
  stars:[{id:'carry',position:[250,377]},{id:'bay-entry',position:[430,377]},{id:'far-bay',position:[590,377]}],
  exit:{id:'parking-bay',label:'PARK HERE',x:400,y:345,width:320,height:50,condition:{kind:'settle',seconds:.75,maxSpeed:.12}},
  instructions:{
    objective:'Stop the whole block inside the green bay',
    hint:'Friction 0 keeps the block sliding. Friction 0.3 slows it gradually over a few seconds, so start braking before the green bay. For all stars, brake a little after passing the first star. Come to rest fully inside the bay for 0.75 seconds.',
    sceneDescription:'A protected non-rotating sliding block (slider) starts moving right at 2 m/s on a fixed teal Grip surface with downward acceleration 2 m/s². This stationary surface (ID runway, also called friction pad or 跑道) supports friction and restitution, and inherits world surface properties. Sliding friction follows the actual normal contact impulse: on this flat runway friction 0.3 gives deceleration about 0.6 m/s² and takes about 3.3 seconds to stop from the initial speed. It has no motor, conveyor speed or movement direction. Horizontal acceleration changes the world, not the surface. A wide green parking bay spans x=400..720; the entire block must stay inside at speed at most 0.12 m/s for 0.75 simulated seconds. The Grip surface ends at x=760 with an open drop. No direct block movement or velocity edits.',
    canvasHeading:'LESS SLIDE. MORE CONTROL.',readyCaption:'THE GREEN BAY IS A STOP, NOT A CHECKPOINT.',
    exampleMessages:['Set surface friction to 0','Set surface friction to 0.3'],
    suggestedMessages:['Set surface friction to 0','Set surface friction to 0.3'],
    exampleNotice:'Send friction 0 to begin. Brake with 0.3 before the green bay; stopping needs distance.',
  },
};
