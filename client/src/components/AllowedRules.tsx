import { useId, useState } from 'react';

interface AllowedRulesProps {
  rules: readonly string[];
  variant?: 'composer' | 'tutorial';
}

// Receives labels from the runtime capability catalog; this component grants no permissions.
export function AllowedRules({ rules, variant = 'composer' }: AllowedRulesProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const preview = rules.length ? `You can change: ${rules[0]}${rules.length > 1 ? ` · +${rules.length - 1} more` : ''}`
    : 'No editable rules in this level.';
  return <div className={`allowed-rules allowed-rules--${variant}`}>
    <div className="allowed-rules-heading">
      <p className="allowed-rules-preview">{preview}</p>
      <button className="allowed-rules-toggle" type="button" disabled={!rules.length} aria-expanded={expanded}
        aria-controls={id} aria-label={expanded ? 'Collapse allowed rules' : 'Expand allowed rules'}
        onClick={() => setExpanded(previous => !previous)}>
        {expanded ? 'Collapse' : 'Expand'}
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
      </button>
    </div>
    <div id={id} className="allowed-rules-panel" hidden={!expanded} role="region" aria-label="Allowed rules" tabIndex={0}>
      <ul aria-label="Editable rules">{rules.map(rule => <li key={rule}>{rule}</li>)}</ul>
    </div>
  </div>;
}
