import { CompileRequestSchema, validateCompilation, type CompileRequest } from '../../shared/compiler';
import { validateRuleState } from '../../shared/rules';
import { findLevel } from '../../client/src/levels/catalog';
import { ruleContext } from '../../client/src/levels/rules';
import { CompilerError, requestJson } from './ai-client';
import type { AiConfig } from './config';
import { COMPILER_SYSTEM, compilerInput } from './compiler-prompt';
import { withProviderFallback } from './provider-fallback';
import { repairCompilation } from './compilation-repair';
import { withCompilationSignal } from './compilation-budget';

export async function compileRules(input: unknown, config: AiConfig, signal?: AbortSignal, fetcher?: typeof fetch) {
  const request = CompileRequestSchema.parse(input);
  const level = findLevel(request.levelId);
  if (!level) throw new CompilerError('Unknown level.', 400);
  const context = ruleContext(level);
  validateRuleState(request.rules, context);
  const user = compilerInput(level, request, context);
  const deadline = AbortSignal.any([AbortSignal.timeout(config.timeoutMs), ...(signal ? [signal] : [])]);
  const first = await withCompilationSignal(deadline, () => withProviderFallback(config, async (provider, attemptSignal) => {
    const output = await requestJson(provider, COMPILER_SYSTEM, user, attemptSignal, fetcher);
    return { output, result: validateCompilation(request, output, context), provider };
  }, deadline, request.requestId), signal);
  return repairCompilation(request, first.output, first.result, context,
    conversation => first.provider.provider === 'gemini'
      ? withProviderFallback(config, (provider, repairSignal) => requestJson(provider, COMPILER_SYSTEM, user, repairSignal, fetcher, conversation), deadline, `${request.requestId}:repair`)
      : requestJson(first.provider, COMPILER_SYSTEM, user, deadline, fetcher, conversation), deadline, signal);
}
export type { CompileRequest };
