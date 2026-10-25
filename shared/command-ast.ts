import type { PropertyName } from './rules';

// Syntax retains names and relative changes. Scene IDs and permissions belong to
// the semantic/execution stages, so a syntax match never grants access.
export type TargetReference =
  | { type: 'world' }
  | { type: 'named'; name: string }
  | { type: 'device'; kind: string };
export interface CommandSubject { targets: TargetReference[]; property: PropertyName }
export type CommandNode =
  | { type: 'set'; subject: CommandSubject; value: number }
  | { type: 'scale'; subject: CommandSubject; factor: number }
  | { type: 'sensor_trigger' };
export interface CommandProgram { type: 'program'; statements: CommandNode[] }
