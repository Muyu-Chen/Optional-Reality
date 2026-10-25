import type { RuleState } from '../../../shared/rules';

type StepEntry = { type:'step'; started:boolean; tutorialId:string|null; seenTutorials:readonly string[] };
type RuleEntry = { type:'rules'; rules:RuleState };
export type SimulationEntry = StepEntry | RuleEntry;

/** Inputs at fixed-step boundaries, not lossy copies of positions or engine internals. */
export class SimulationJournal {
  readonly entries:SimulationEntry[]=[];
  recording=true;
  rules(rules:RuleState) { if(this.recording)this.entries.push({type:'rules',rules:structuredClone(rules)}); }
  step(started:boolean,tutorialId:string|null,seenTutorials:Iterable<string>) { if(this.recording)this.entries.push({type:'step',started,tutorialId,seenTutorials:[...seenTutorials]}); }
}
