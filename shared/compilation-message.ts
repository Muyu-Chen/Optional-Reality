import { z } from 'zod';
import { OperationSchema, Property, applyRules, type RuleContext, type RuleState } from './rules';
import { limitAbsoluteOperations } from './rule-limits';
import { checkForceUnits } from './force-units';
import { checkAdditiveMeaning } from './additive-command';

export const ModelMessageSchema = z.object({
  id: z.string().min(1).max(80), operations: z.array(OperationSchema).max(16),
  error: z.string().trim().min(1).max(300).nullable(),
  understoodAs: z.string().trim().min(1).max(240).nullish(),
}).strict();
const AdjustmentSchema = z.object({
  target: z.string(), property: Property, requested: z.number().finite(), applied: z.number().finite(),
  minimum: z.number().finite(), maximum: z.number().finite(),
}).strict();
export const CompilationMessageSchema = z.union([
  z.object({
    id: z.string(), operations: z.array(OperationSchema).min(1).max(16),
    understoodAs: z.string().trim().min(1).max(240).optional(),
    adjustments: z.array(AdjustmentSchema).max(16).optional(),
  }).strict(),
  z.object({ id: z.string(), operations: z.array(OperationSchema).length(0), error: z.string().trim().min(1).max(300) }).strict(),
]);
export type CompilationMessage = z.infer<typeof CompilationMessageSchema>;

export function failedCompilationMessage(id: string, error: unknown) {
  const reason = error instanceof z.ZodError ? 'The compiler returned invalid rules for this message. Edit it and try again.'
    : error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return { id, operations: [], error: reason.trim().slice(0, 300) || 'This message could not be prepared. Edit it and try again.' };
}

/** Shared server/client validation; a failed operation never commits a partial message. */
export function validateCompiledOperations(current: RuleState, input: unknown, context: RuleContext) {
  const candidates = z.array(OperationSchema).min(1).max(16).parse(input);
  const limited = limitAbsoluteOperations(candidates, context);
  const state = applyRules(current, limited.operations, context);
  return { ...limited, state };
}

export function compileModelMessage(input: unknown, original: { id: string; text: string }, current: RuleState, context: RuleContext): { message: CompilationMessage; state: RuleState } {
  try {
    const model = ModelMessageSchema.parse(input);
    if (model.error !== null) return { message: failedCompilationMessage(original.id, model.error), state: current };
    checkForceUnits(original.text);
    checkAdditiveMeaning(original.text, model.operations);
    const { operations, adjustments, state } = validateCompiledOperations(current, model.operations, context);
    return { state, message: { id: original.id, operations,
      ...(model.understoodAs && model.understoodAs !== original.text.trim() ? { understoodAs: model.understoodAs } : {}),
      ...(adjustments.length ? { adjustments } : {}),
    } };
  } catch (error) {
    return { message: failedCompilationMessage(original.id, error), state: current };
  }
}
