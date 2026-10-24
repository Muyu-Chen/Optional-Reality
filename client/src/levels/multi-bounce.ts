import type { LevelDefinition } from './types';

export const multiBounce: LevelDefinition = {
  id:'multi-bounce', number:2, stage:2, title:'Not Too High',
  viewport:{width:800,height:510,pixelsPerMetre:80}, timeLimitSeconds:30, initialGravity:2, failOnFall:true,

  environment:{restitution:.1,friction:0},
  ball:{id:'ball-A',label:'BALL A',position:[80,110],velocity:[1,0],radius:16,restitution:0},
  tracks:[
    {id:'first-pad',label:'First pad',aliases:['first pad','第一块板'],points:[[40,427],[385,427]],thickness:14,feature:'bounce'},
    {id:'second-pad',label:'Second pad',aliases:['second pad','第二块板'],points:[[415,427],[760,427]],thickness:14,feature:'bounce'},
  ],
  guideLines:[], exit:{id:'exit',label:'EXIT',x:570,y:315,width:65,height:65},
  instructions:{
    objective:'Two bounces. A softer second landing.',
    hint:'Start with surface bounce 0.9. After the first rebound, send 0.5 before the second landing. Keeping it high sends the ball above the exit. Gravity is also available.',
    sceneDescription:'Two separated blue horizontal bounce pads at the same height. Ball A moves right and is protected. first-pad (First pad) and second-pad (Second pad) inherit world surface properties unless individually overridden. Gravity, horizontal acceleration, surface restitution and friction are editable. The exit is just above the second pad. Falling below the red bottom edge fails.',
    canvasHeading:'SAME RULE. TWO DIFFERENT MOMENTS.',readyCaption:'A STRONG START. A SOFTER RETURN.',
    exampleMessages:['Set surface bounce to 0.9','Set surface bounce to 0.5'],
    suggestedMessages:['Set surface bounce to 0.9','Set surface bounce to 0.5','stop gravity'],
    exampleNotice:'Send 0.9 to start. Watch the first bounce, then send 0.5 while the ball is still in the air.',
  },
};
