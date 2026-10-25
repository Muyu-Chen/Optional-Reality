import type { LevelDefinition } from './types';

export const multiBounce: LevelDefinition = {
  id:'multi-bounce', number:2, stage:2, title:'Not Too High',
  viewport:{width:800,height:510,pixelsPerMetre:80}, timeLimitSeconds:30, initialAcceleration:[0,2],

  environment:{restitution:.1,friction:0},
  ball:{id:'ball-A',label:'BALL A',position:[80,110],velocity:[1,0],radius:16,restitution:0},
  tracks:[
    {id:'first-pad',label:'First pad',aliases:['first pad','第一块板'],points:[[40,427],[385,427]],thickness:14,feature:'bounce'},
    {id:'second-pad',label:'Second pad',aliases:['second pad','第二块板'],points:[[415,427],[760,427]],thickness:14,feature:'bounce'},
  ],
  guideLines:[],
  stars:[{id:'first-impact',position:[230,399],radius:12},{id:'high-arc',position:[365,187],radius:12},{id:'above-exit',position:[560,280],radius:12}],
  exit:{id:'exit',label:'EXIT',x:570,y:315,width:65,height:65},
  instructions:{
    objective:'Reach the exit. Collect the high stars for full score.',
    hint:'High bounce reaches the first high star. After collecting it, increase downward acceleration to bend the next arc back toward the star above the exit. Lowering bounce is another way to reach the exit, but may miss a star.',
    sceneDescription:'Two separated blue horizontal bounce pads at the same height. Ball A moves right and is protected. first-pad (First pad) and second-pad (Second pad) inherit world surface properties unless individually overridden. Gravity, horizontal acceleration, surface restitution and friction are editable. The exit is just above the second pad. All four play-area edges are open; fully leaving the play area fails.',
    canvasHeading:'SAME RULE. TWO DIFFERENT MOMENTS.',readyCaption:'A STRONG START. A SOFTER RETURN.',
    exampleMessages:['Set surface bounce to 0.9','Set surface bounce to 0.5'],
    suggestedMessages:['Set surface bounce to 0.9','Set acceleration downward to 4','Set surface bounce to 0.5'],
    exampleNotice:'Send 0.9 to start. Watch the first bounce, then send 0.5 while the ball is still in the air.',
  },
};
