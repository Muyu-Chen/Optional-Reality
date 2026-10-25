import type { LevelDefinition } from './types';

export const oneMoreTurn: LevelDefinition = {
  id:'one-more-turn',number:1,stage:2,title:'One More Turn',
  viewport:{width:800,height:510,pixelsPerMetre:80},timeLimitSeconds:30,initialAcceleration:[0,0],
  environment:{restitution:0,friction:0},editableDevices:[],
  ball:{id:'ball-A',label:'BALL A',position:[400,300],velocity:[0,0],radius:16,restitution:0},
  tracks:[{id:'spring-base',points:[[350,470],[450,470]],thickness:12,preset:true}],guideLines:[],
  stars:[{id:'fall',position:[400,370],radius:12},{id:'rebound',position:[400,250],radius:12},{id:'one-more-turn',position:[400,150],radius:12}],
  devices:[{kind:'spring',id:'fixed-spring',area:{x:370,y:420,width:60,height:8},power:1,launchBase:[0,0],launchPerPower:[0,0],response:'elastic',stiffness:26,damping:.15}],
  exit:{id:'exit',label:'EXIT',x:370,y:50,width:60,height:60},
  instructions:{
    timingLesson:'spring',
    objective:'Fall, rebound, and find all three stars for full score.',
    hint:'Add gravity to fall through the lower star. The blue spring compresses and rebounds under real elastic force. Reverse gravity to reach stars above the original drop height. Other routes are welcome.',
    sceneDescription:'A geometric star puzzle. Ball A floats at rest with zero environment acceleration. A passive blue spring below compresses under contact and returns stored energy with slight damping; it does not assign launch velocity or add energy. The lower star is on the falling route, and two higher stars require changing the environment acceleration. Reaching the exit passes; collecting every star gives full score. The spring and its base are preset. Edit the environment acceleration vector or surface properties, not the ball. Gravity is an alias for its vertical component.',
    canvasHeading:'ONE RULE. A NEW DIRECTION.',readyCaption:'THREE STARS. FIND YOUR WAY.',
    exampleMessages:['add gravity','reverse gravity'],suggestedMessages:['add gravity','reverse gravity','stop gravity'],
    exampleNotice:'Send add gravity to fall. The spring rebounds naturally; reverse gravity to reach higher than the drop point.',
  },
};
