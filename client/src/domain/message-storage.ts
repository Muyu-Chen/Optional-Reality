import type { LevelDefinition } from '../levels/types';
import { initialRules, ruleContext } from '../levels/rules';
import { prepareMessage, type Message } from './queue';

export const messageStorageKey = (level: LevelDefinition) => `optional-reality.${level.id}.messages.v1`;

export function loadMessages(level: LevelDefinition): Message[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(messageStorageKey(level)) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((text): text is string => typeof text === 'string' && text.length > 0 && text.length <= 240)
      .slice(0, 24)
      .map(text => prepareMessage(crypto.randomUUID(), text, ruleContext(level), initialRules(level)));
  } catch {
    return [];
  }
}
