import { z } from 'zod';
import { OperationSchema, Property, RuleStateSchema, applyRules, type RuleContext } from './rules';
import { limitAbsoluteOperations } from './rule-limits';

export const CompileRequestSchema = z.object({
  requestId: z.string().min(1).max(80), levelId: z.string().min(1).max(80),
  sceneVersion: z.number().int().min(0), queueRevision: z.number().int().min(0),
  messages: z.array(z.object({ id: z.string().min(1).max(80), text: z.string().trim().min(1).max(240) }).strict()).min(1).max(24),
  rules: RuleStateSchema,
}).strict().refine(value => new Set(value.messages.map(message => message.id)).size === value.messages.length, 'Duplicate message IDs.');
export type CompileRequest = z.infer<typeof CompileRequestSchema>;
const AdjustmentSchema = z.object({ target:z.string(),property:Property,requested:z.number().finite(),applied:z.number().finite(),minimum:z.number().finite(),maximum:z.number().finite() }).strict();
export const ModelOutputSchema = z.object({
  messages: z.array(z.object({
    id: z.string().min(1).max(80), operations: z.array(OperationSchema).max(16), error: z.string().max(300).nullable(),
    understoodAs: z.string().trim().min(1).max(240).nullish(),
  }).strict()).min(1).max(24),
}).strict();
export const CompileResponseSchema = z.object({
  requestId: z.string(), levelId: z.string(), sceneVersion: z.number().int(), queueRevision: z.number().int(),
  messages: z.array(z.object({ id: z.string(), operations: z.array(OperationSchema).min(1).max(16), understoodAs: z.string().trim().min(1).max(240).optional(), adjustments:z.array(AdjustmentSchema).max(16).optional() }).strict()).min(1).max(24),
}).strict();
export function validateCompilation(request: CompileRequest, output: unknown, context: RuleContext) {
  const compiled = ModelOutputSchema.parse(output);
  if (compiled.messages.length !== request.messages.length || compiled.messages.some((message, index) => message.id !== request.messages[index].id)) throw new Error('The compiler returned missing, duplicate, or reordered message IDs.');
  let state = request.rules;
  const messages = [];
  for (const message of compiled.messages) {
    if (message.error) throw new Error(`Message ${request.messages.findIndex(item => item.id === message.id) + 1}: ${message.error}`);
    if (!message.operations.length) throw new Error('The compiler returned an empty operation list.');
    const {operations,adjustments} = limitAbsoluteOperations(message.operations,context);
    state = applyRules(state, operations, context);
    messages.push({id:message.id,operations,
      ...(message.understoodAs && message.understoodAs !== request.messages[messages.length].text.trim() ? {understoodAs:message.understoodAs} : {}),
      ...(adjustments.length ? {adjustments} : {}),
    });
  }
  const { rules: _rules, messages: _messages, ...identity } = request;
  return CompileResponseSchema.parse({ ...identity, messages });
}
