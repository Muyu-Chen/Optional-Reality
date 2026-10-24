import { CompileRequestSchema, validateCompilation, type CompileRequest } from '../../shared/compiler';
import { validateRuleState } from '../../shared/rules';
import { findLevel } from '../../client/src/levels/catalog';
import { ruleContext } from '../../client/src/levels/rules';
import { CompilerError, requestJson } from './ai-client';
import type { AiConfig } from './config';
import { COMPILER_SYSTEM, compilerInput } from './compiler-prompt';

export async function compileRules(input: unknown, config: AiConfig, signal?: AbortSignal, fetcher?: typeof fetch) {
  const request = CompileRequestSchema.parse(input);
  const level = findLevel(request.levelId);
  if (!level) throw new CompilerError('Unknown level.', 400);
  const context = ruleContext(level);
  validateRuleState(request.rules, context);
  const output = await requestJson(config, COMPILER_SYSTEM, compilerInput(level, request, context), signal, fetcher);
  return validateCompilation(request, output, context);
}
export type { CompileRequest };
