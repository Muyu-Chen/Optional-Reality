import type { Operation, RuleContext } from './rules';

export const SPRING_CONTROL_NAMES = ['power', 'strength', 'elasticity', 'bounce', 'bounciness', '功率', '力度', '弹射强度', '弹性', '弹力'] as const;
export const SPRING_STRENGTH_STEP = 1;
export const SPRING_LANGUAGE_POLICY = `Interpret spring/toaster wording in the named device's context. Its launch strength is spring_power; collision surface restitution is a separate property.
"toaster增加弹性", "toaster增加弹力", "increase toaster elasticity", and "make the toaster bouncier" ask for a stronger launch from that existing device. Emit add_property on its spring_power, amount=${SPRING_STRENGTH_STEP} when no amount is given. Do not reject these clear colloquial intents just because a toaster has no property literally named elasticity. Do not substitute world.restitution or change another surface.
Preserve explicit relative amounts: "toaster弹性增加0.5" means spring_power +0.5; decrease without an amount means -${SPRING_STRENGTH_STEP}. Explicit assignments and doubling remain set/scale operations. Show understoodAs with the named device, Spring strength, and exact change. This is a visible game preset.
Generic surface bounce/弹性/弹力 still means restitution. An explicit collision restitution coefficient or stiffness in N/m is not launch power; do not silently convert scientific quantities. Unknown, ambiguous and preset devices keep their existing validation. Never add an unrequested world edit or direct actor impulse.`;

const numeric='[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[+-]?\\d+)?';
const noun='(?:弹射强度|弹性|弹力|力度|功率)';
const verb='(?<verb>增加|增强|提高|减少|减弱|降低)';
const patterns=[
  new RegExp(`^(?:把|将)?(?<target>.+?)(?:的)?${verb}(?:一点|一些)?${noun}(?:\\s*(?<amount>${numeric}))?$`,'i'),
  new RegExp(`^(?:把|将)?(?<target>.+?)(?:的)?${noun}${verb}(?:(?:一点|一些)|\\s*(?<amount>${numeric}))?$`,'i'),
  new RegExp(`^(?<verb>increase|decrease) (?:the )?(?<target>.+?)(?:['’]s)? (?:elasticity|bounce|bounciness|strength|power)(?: by (?<amount>${numeric}))?$`,'i'),
  /^(?:make|give) (?:the )?(?<target>.+?) (?:bouncier|stronger|more elastic|more bounce)$/i,
];
const compact=(value:string)=>value.trim().toLowerCase().replace(/的$/, '');

/** Complete, device-scoped relative phrases only; broader prose still goes to AI. */
export function springLanguageCommand(input:string,context?:RuleContext): {operations:Operation[];understoodAs:string} | undefined {
  const text=input.trim().replace(/[。.!！]$/,'');
  if(text.length>240)return;
  const match=patterns.map(pattern=>pattern.exec(text)).find(Boolean);
  if(!match?.groups)return;
  const name=compact(match.groups.target);
  const named=context?.targets.filter(target=>[target.id,target.label,...(target.aliases||[])].some(alias=>alias && compact(alias)===name)) || [];
  const matches=named.length?named:['spring','toaster','弹簧','面包机'].includes(name)?context?.targets.filter(target=>target.kind==='spring') || []:[];
  if(matches.length!==1 || matches[0].kind!=='spring')return;
  const target=matches[0];
  if(!target.properties.spring_power)return;
  const amount=Number(match.groups.amount ?? SPRING_STRENGTH_STEP)*(/^(?:decrease|减少|减弱|降低)$/i.test(match.groups.verb || '')?-1:1);
  if(!Number.isFinite(amount))throw new Error('Use a finite amount for spring strength.');
  return {operations:[{type:'add_property',target:target.id,property:'spring_power',amount}],
    understoodAs:`${target.label || target.id}: Spring strength ${amount<0?'−':'+'} ${Math.abs(amount)} at Send now.`};
}
