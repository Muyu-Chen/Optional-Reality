import { accelerationLabel, type AccelerationVector } from '../../../shared/acceleration';
import type { RuleState } from '../../../shared/rules';
import type { LevelDefinition } from '../levels/types';
import { ruleContext } from '../levels/rules';
import { tierFor } from '../levels/progression';

interface RulesDrawerProps {
  level: LevelDefinition;
  acceleration: AccelerationVector;
  rules?: RuleState;
  commandCount: number;
  onClose: () => void;
  onSuggest: (text: string) => void;
  onLoadExample: () => void;
}

export function RulesDrawer({ level, acceleration, rules, commandCount, onClose, onSuggest, onLoadExample }: RulesDrawerProps) {
  const tier = tierFor(level);
  const context = ruleContext(level);
  return (
    <aside className="rules-drawer glass">
      <div className="dock-heading">
        <span>RULES & HINTS</span><button className="quiet-button" onClick={onClose}>Close</button>
      </div>
      <p>{level.instructions.hint}</p>
      <p className="tier-description">Level {level.number} · {tier?.title}: {tier?.lesson}</p>
      <div className="hint-messages">
        {level.instructions.suggestedMessages.map(text => (
          <button className="small-button" key={text} onClick={() => onSuggest(text)}>{text}</button>
        ))}
      </div>
      <button className="quiet-button" onClick={onLoadExample}>Load starter messages</button>
      <dl>
        <div><dt>Acceleration</dt><dd>{accelerationLabel(acceleration)}</dd></div>
        {Object.entries(rules?.values || {}).flatMap(([target, properties]) => (
          Object.entries(properties).map(([property, value]) => (
            <div key={target + property}>
              <dt>{target === 'world' ? 'All surfaces' : context.targets.find(item => item.id === target)?.label || target} · {property.replaceAll('_', ' ')}</dt>
              <dd>{value}</dd>
            </div>
          ))
        ))}
      </dl>
      {level.commandLimit && <p>{level.commandLimit - commandCount} messages remaining</p>}
    </aside>
  );
}
