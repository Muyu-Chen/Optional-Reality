import type { validateCompilation } from '../../shared/compiler';
import { failedCompilationMessage } from '../../shared/compilation-message';

export function arithmeticForClient(result: ReturnType<typeof validateCompilation>, supported: boolean) {
  if (supported) return result;
  return { ...result, messages: result.messages.map(message => message.operations.some(operation => operation.type === 'add_property')
    ? failedCompilationMessage(message.id, 'Refresh the page to use addition and subtraction rules. Your world is unchanged.') : message) };
}
