import { z } from 'zod';

export const Acceleration = z.number().finite().min(-10).max(10);
export const OperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('set_gravity'), acceleration: Acceleration }).strict(),
  z.object({ type: z.literal('reverse_gravity') }).strict(),
]);
export type Operation = z.infer<typeof OperationSchema>;
export type ParsedCommand = { operation: Operation; error?: never } | { operation?: never; error: string };

export function parseCommand(input: string): ParsedCommand {
  const text = input.trim().toLowerCase().replace(/[“”"'.!?]/g, '').replace(/\s+/g, ' ');
  if (/^(add|enable|turn on)( the)? gravity$/.test(text) || text === '加重力') {
    return { operation: { type: 'set_gravity', acceleration: 1 } };
  }
  if (/^(stop|disable|remove|turn off)( the)? gravity$/.test(text) || /^(no gravity|gravity\s*=\s*0)$/.test(text) || text === '停止重力') {
    return { operation: { type: 'set_gravity', acceleration: 0 } };
  }
  if (/^reverse( the)? gravity$/.test(text) || text === '反转重力') {
    return { operation: { type: 'reverse_gravity' } };
  }
  return { error: 'Try “add gravity”, “stop gravity”, or “reverse the gravity”. This demo recognises these commands locally.' };
}

export function applyOperation(current: number, candidate: unknown): number {
  Acceleration.parse(current);
  const operation = OperationSchema.parse(candidate);
  const next = operation.type === 'set_gravity' ? operation.acceleration : -current;
  return Object.is(next, -0) ? 0 : next;
}

export function describeOperation(operation: Operation): { title: string; detail: string } {
  if (operation.type === 'reverse_gravity') {
    return { title: 'Reverse gravity', detail: 'Invert the gravity that is active when sent.' };
  }
  if (operation.acceleration === 0) return { title: 'gravity = 0', detail: 'No gravitational acceleration.' };
  return {
    title: `Gravity ${operation.acceleration > 0 ? '↓' : '↑'}`,
    detail: `${operation.acceleration > 0 ? 'Downward' : 'Upward'} · a = ${Math.abs(operation.acceleration)} m/s²`,
  };
}
