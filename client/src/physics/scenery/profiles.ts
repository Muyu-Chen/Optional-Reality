export type LandscapeFeature = 'waterfall' | 'viaduct' | 'windmill' | 'lake' | 'orbit' | 'nebula' | 'shop';
export interface BakeryPalette {
  readonly wall:string; readonly plaster:string; readonly window:string; readonly awning:string;
  readonly light:string; readonly menu:string; readonly motif:'bunting'|'pinwheel'|'moon';
}
export interface SceneryProfile {
  readonly name:string; readonly feature:LandscapeFeature;
  readonly sky:readonly [string,string]; readonly ridges:readonly [string,string];
  readonly ridgeShift:number; readonly ridgeRise:number; readonly terrain:string;
  readonly sun:readonly [number,number]; readonly planet:readonly [number,number,string,string];
  readonly bakery?:BakeryPalette;
}
const profile=(value:SceneryProfile):SceneryProfile=>Object.freeze(value);
const valley=(name:string,feature:LandscapeFeature,sky:readonly[string,string],ridges:readonly[string,string],ridgeShift:number,ridgeRise:number,terrain:string,sun:readonly[number,number]):SceneryProfile=>
  profile({name,feature,sky,ridges,ridgeShift,ridgeRise,terrain,sun,planet:[884,274,'#eedac6','#b8abc4']});
const cosmos=(name:string,feature:LandscapeFeature,sky:readonly[string,string],planet:readonly[number,number,string,string]):SceneryProfile=>
  profile({name,feature,sky,planet,ridges:['#b8cfcb','#9bb9b0'],ridgeShift:0,ridgeRise:0,terrain:'#b4c59a',sun:[585,196]});
const shop=(name:string,bakery:BakeryPalette):SceneryProfile=>
  profile({...valley(name,'shop',['#dce9dc','#d7dfbd'],['#b8cfcb','#9bb9b0'],0,0,'#b4c59a',[585,196]),bakery:Object.freeze(bakery)});

/** Every shipped small level gets its own purely visual setting. No collision/rule data lives here. */
export const sceneryProfiles=Object.freeze({
  'gravity-lab':cosmos('Quiet orbit','orbit',['#b6c9e1','#a8b8ce'],[884,274,'#eedac6','#b8abc4']),
  'one-more-turn':cosmos('Rose nebula','nebula',['#d5c5de','#c9b8ca'],[185,253,'#f2d1b9','#bc9bb7']),
  'bring-it-back':cosmos('Amber return orbit','orbit',['#e0d0b8','#c9becb'],[775,225,'#e8c28e','#b198ac']),
  'over-the-wall':cosmos('Jade horizon','nebula',['#c1dad4','#a9c3ca'],[180,230,'#e6e5bd','#9fb8b6']),
  'side-door':cosmos('Lilac passage','orbit',['#cdcbe8','#b7c6dd'],[810,230,'#ded5ec','#a59cc8']),
  'bounce':valley('Waterfall meadow','waterfall',['#dce9dc','#d7dfbd'],['#b8cfcb','#9bb9b0'],0,0,'#b4c59a',[585,196]),
  'multi-bounce':valley('Twin peaks','viaduct',['#ead8db','#ddd2c2'],['#c3b4c9','#ae9fb0'],60,-27,'#c1ba9f',[720,220]),
  'friction-runway':valley('Golden fields','windmill',['#f2e4c9','#e2d5ae'],['#d2c4aa','#b7b59b'],-70,35,'#c8bd8c',[310,205]),
  'catch-cup':valley('Stillwater shore','lake',['#d4e4e9','#cee0d9'],['#abc6ce','#93b3b7'],110,8,'#aec6aa',[650,180]),
  'bank-shot':cosmos('Blue ricochet','orbit',['#bfd5e6','#b4c1d8'],[210,210,'#dfd9ba','#a5b3c9']),
  'return-to-dock':valley('Copper harbour','lake',['#edd8bd','#d5dcca'],['#c9c0b0','#a9b8a7'],-25,18,'#b7c2a1',[670,190]),
  'one-last-bounce':valley('Evening landing','viaduct',['#e5d5e8','#d7d6c2'],['#c1b2ce','#a9afb5'],85,12,'#b8bf9c',[260,220]),
  'toaster':shop('Morning at the bakery',{wall:'#e9d9ba',plaster:'#fff3db',window:'#ece2bf',awning:'#a58e63',light:'#fff2c4',menu:'BAKED AT SUNRISE',motif:'bunting'}),
  'breeze':shop('An open-window afternoon',{wall:'#dce0cd',plaster:'#f1f3df',window:'#c9dfe2',awning:'#709b95',light:'#f3f8de',menu:'A LITTLE FRESH AIR',motif:'pinwheel'}),
  'reality-breakdown':shop('The last evening order',{wall:'#e4d0c5',plaster:'#f8e8de',window:'#c9c3db',awning:'#94829e',light:'#f8e3cf',menu:'LAST LOAF TONIGHT',motif:'moon'}),
});

export function sceneryProfile(levelId:string):SceneryProfile {
  return Object.hasOwn(sceneryProfiles,levelId)?sceneryProfiles[levelId as keyof typeof sceneryProfiles]:sceneryProfiles.bounce;
}
