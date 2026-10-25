import type { CommandProgram, TargetReference } from './command-ast';
import type { RuleContext } from './rules';

/** Stable interpretations shared by local preparation and the model prompt. */
export const QUALITATIVE_PRESETS = {
  bounce: { soft: .15, bouncy: .8, almostPerfect: .95, perfect: 1 },
  acceleration: { gentle: .5, strong: 2, veryStrong: 5 },
  friction: { slippery: .03, grippy: .6 },
  speedFactor: { slower: .5, muchSlower: .25, faster: 2 },
} as const;

export const QUALITATIVE_POLICY = `Everyday qualitative instructions use these consistent presets: ${JSON.stringify(QUALITATIVE_PRESETS)}.
"Almost perfectly bouncy" means restitution=0.95, "perfectly bouncy"=1, "soft / barely bouncy"=0.15, "bouncy"=0.8. "Slippery" means friction=0.03; "grippy"=0.6. Resolve the requested global/named scope as usual.
"A gentle upward acceleration" means set WORLD acceleration_y=-0.5 m/s²; strong=2 and very strong=5, with direction determining the axis/sign. "Give the ball a gentle upward acceleration" changes the environment, not the protected actor. Preserve the other component.
"Make the conveyor much slower" means scale_property conveyor_speed factor=0.25, "slower"=0.5, "faster"=2; resolve the actual editable named device. These factors read its actual signed value at execution, preserving reverse direction. Scaling a stopped device keeps it stopped; never invent a nonzero speed.
These are transparent game presets, not universal scientific definitions. Include understoodAs showing the exact value or factor, direction and target. Explicit numbers override qualitative defaults; conflicting quantities or directions still need clarification. Do not guess which of several surfaces "this surface" means. Unknown/readonly targets still fail. Never append unrequested operations or choose a puzzle solution.`;

/** Consume only complete, unambiguous qualitative phrases; other prose goes to AI. */
export function qualitativeProgram(input: string, context?: RuleContext): CommandProgram | undefined {
  const text = input.trim().toLowerCase().replace(/[.!。！]$/, '').trim();
  if (input.length > 240) return;
  const set = (property: 'restitution' | 'friction' | 'acceleration_x' | 'acceleration_y', value: number, target: TargetReference = {type:'world'}): CommandProgram => ({type:'program', statements:[{type:'set',subject:{targets:[target],property},value}]});
  const surface = /^(?:make|set) (.+?) (almost perfectly bouncy|perfectly bouncy|barely bouncy|soft|bouncy|slippery|grippy)$/.exec(text);
  if (surface) {
    const name = surface[1].replace(/^the /, '');
    let target: TargetReference;
    if (['all surfaces','surfaces','surface','ground','floor','global surface'].includes(name)) target={type:'world'};
    else if (name==='this surface') {
      const surfaces=context?.targets.filter(item=>item.kind==='surface');
      if (surfaces?.length!==1) throw new Error('Name the surface you mean; more than one surface may be present.');
      target={type:'named',name:surfaces[0].id};
    } else target={type:'named',name};
    const phrase=surface[2];
    if (phrase==='slippery' || phrase==='grippy') return set('friction',QUALITATIVE_PRESETS.friction[phrase],target);
    const value=phrase==='almost perfectly bouncy'?QUALITATIVE_PRESETS.bounce.almostPerfect:phrase==='perfectly bouncy'?QUALITATIVE_PRESETS.bounce.perfect:phrase==='bouncy'?QUALITATIVE_PRESETS.bounce.bouncy:QUALITATIVE_PRESETS.bounce.soft;
    return set('restitution',value,target);
  }
  const acceleration=/^(?:give (?:the ball|the world|the environment) (?:a |an )?|set (?:a |an )?)(gentle|strong|very strong) (upward|downward|leftward|rightward) acceleration$/.exec(text);
  const chinese=/^(?:给(?:小球|环境)|让(?:小球|环境))?(轻柔|轻微|强烈)的?(向上|向下|向左|向右)加速度$/.exec(text);
  if(acceleration || chinese) {
    const strength=acceleration?.[1] || chinese![1];
    const magnitude=strength==='gentle'||strength==='轻柔'||strength==='轻微'?QUALITATIVE_PRESETS.acceleration.gentle:strength==='very strong'?QUALITATIVE_PRESETS.acceleration.veryStrong:QUALITATIVE_PRESETS.acceleration.strong;
    const direction=acceleration?.[2] || chinese![2];
    const horizontal=['leftward','rightward','向左','向右'].includes(direction);
    const negative=['upward','leftward','向上','向左'].includes(direction);
    return set(horizontal?'acceleration_x':'acceleration_y',magnitude*(negative?-1:1));
  }
  const speed=/^make (?:the )?(conveyor|belt|fan|rotor|wheel) (much slower|slower|faster)$/.exec(text);
  if(speed) {
    const kind=['conveyor','belt'].includes(speed[1])?'conveyor':speed[1]==='fan'?'fan':'rotor';
    const property=kind==='conveyor'?'conveyor_speed':kind==='fan'?'fan_power':'angular_speed';
    const factor=speed[2]==='much slower'?QUALITATIVE_PRESETS.speedFactor.muchSlower:speed[2]==='slower'?QUALITATIVE_PRESETS.speedFactor.slower:QUALITATIVE_PRESETS.speedFactor.faster;
    return {type:'program',statements:[{type:'scale',subject:{targets:[{type:'device',kind}],property},factor}]};
  }
}
