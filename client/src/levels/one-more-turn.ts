import type { LevelDefinition } from './types';

export const oneMoreTurn: LevelDefinition = {
  id:'one-more-turn',number:1,stage:2,title:'One More Turn',
  viewport:{width:800,height:510,pixelsPerMetre:80},timeLimitSeconds:30,initialAcceleration:[0,0],
  environment:{restitution:0,friction:0},editableDevices:[],
  ball:{id:'ball-A',label:'BALL A',position:[400,300],velocity:[0,0],radius:16,restitution:0},
  tracks:[{id:'spring-base',points:[[350,470],[450,470]],thickness:12,preset:true}],guideLines:[],
  stars:[{id:'fall',position:[400,370],radius:12},{id:'rebound',position:[400,250],radius:12},{id:'one-more-turn',position:[400,150],radius:12}],
  devices:[{kind:'spring',id:'fixed-spring',area:{x:370,y:420,width:60,height:8},power:1,launchBase:[0,-2.1],launchPerPower:[0,0],chargeSeconds:.6,compressionDistance:16}],
  exit:{id:'exit',label:'EXIT',x:370,y:50,width:60,height:60},
  instructions:{
    timingLesson:'spring',
    objective:'Fall, rebound, and find all three stars for full score.',
    hint:'Add gravity to fall through the lower star. The blue spring charges and releases automatically. Reverse gravity after the rebound to reach higher stars. Other routes are welcome.',
    sceneDescription:'A geometric star puzzle. Ball A floats at rest with zero environment acceleration. A fixed blue spring below automatically charges for 0.6 seconds and launches upward. Three collectible stars lie below the spawn, above the spawn on the rebound route, and higher before the top exit. Reaching the exit passes; collecting every star gives full score. The spring and its base are preset. Edit the environment acceleration vector or surface properties, not the ball. Gravity is an alias for its vertical component.',
    canvasHeading:'ONE RULE. A NEW DIRECTION.',readyCaption:'THREE STARS. FIND YOUR WAY.',
    exampleMessages:['add gravity','reverse gravity'],suggestedMessages:['add gravity','reverse gravity','stop gravity'],
    exampleNotice:'Send add gravity to fall. The spring releases automatically; send reverse gravity when you want to reach higher.',
  },
};
