import { z } from 'zod';
import { RuleStateSchema, type RuleContext } from './rules';
import { ModelMessageSchema, CompilationMessageSchema, compileModelMessage } from './compilation-message';

export const CompileRequestSchema = z.object({
  requestId: z.string().min(1).max(80), levelId: z.string().min(1).max(80),
  sceneVersion: z.number().int().min(0), queueRevision: z.number().int().min(0),
  messages: z.array(z.object({ id: z.string().min(1).max(80), text: z.string().trim().min(1).max(240) }).strict()).min(1).max(24),
  rules: RuleStateSchema,
}).strict().refine(value => new Set(value.messages.map(message => message.id)).size === value.messages.length, 'Duplicate message IDs.');
export type CompileRequest = z.infer<typeof CompileRequestSchema>;
export const ModelOutputSchema = z.object({
  messages: z.array(ModelMessageSchema).min(1).max(24),
}).strict();
export const CompileResponseSchema = z.object({
  requestId: z.string(), levelId: z.string(), sceneVersion: z.number().int(), queueRevision: z.number().int(),
  messages: z.array(CompilationMessageSchema).min(1).max(24),
}).strict();
// Validate the trustworthy mapping first; operation/schema errors belong to individual rows.
const ModelEnvelopeSchema = z.object({ messages: z.array(ModelMessageSchema.pick({ id: true }).passthrough()).min(1).max(24) }).strict();
export function validateCompilation(request: CompileRequest, output: unknown, context: RuleContext) {
  const compiled = ModelEnvelopeSchema.parse(output);
  if (compiled.messages.length !== request.messages.length || compiled.messages.some((message, index) => message.id !== request.messages[index].id)) throw new Error('The compiler returned missing, duplicate, or reordered message IDs.');
  let state = request.rules;
  const messages = [];
  for (const [index, candidate] of compiled.messages.entries()) {
    const result = compileModelMessage(candidate, request.messages[index], state, context);
    state = result.state;
    messages.push(result.message);
  }
  const { rules: _rules, messages: _messages, ...identity } = request;
  return CompileResponseSchema.parse({ ...identity, messages });
}
