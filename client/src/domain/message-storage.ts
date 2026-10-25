import type { LevelDefinition } from '../levels/types';
import { initialRules, ruleContext } from '../levels/rules';
import { prepareMessage, type Message } from './queue';

export const messageStorageKey = (level: LevelDefinition) => `optional-reality.${level.id}.messages.v1`;

function prepareDrafts(texts: readonly unknown[], level: LevelDefinition): Message[] {
  return texts.filter((text): text is string => typeof text === 'string' && text.length > 0 && text.length <= 240)
    .slice(0, 24)
    .map(text => prepareMessage(crypto.randomUUID(), text, ruleContext(level), initialRules(level)));
}

export function loadMessages(level: LevelDefinition): Message[] {
  try {
    const stored = localStorage.getItem(messageStorageKey(level));
    // A saved empty list is intentional. Only a new visit receives the starter.
    if (stored === null) return prepareDrafts(level.instructions.initialMessages || [], level);
    const saved: unknown = JSON.parse(stored);
    return Array.isArray(saved) ? prepareDrafts(saved, level) : [];
  } catch {
    return prepareDrafts(level.instructions.initialMessages || [], level);
  }
}
