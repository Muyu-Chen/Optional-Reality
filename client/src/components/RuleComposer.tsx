import { AllowedRules } from './AllowedRules';

interface RuleComposerProps {
  input: string;
  editing: boolean;
  full: boolean;
  placeholder: string;
  storageAvailable: boolean;
  api: { configured: boolean; model: string };
  editableRules?: readonly string[];
  disabled?: boolean;
  preparing?: boolean;
  onInput: (text: string) => void;
  onQueue: () => void;
  onApplyCurrent?: () => void;
  onCancel: () => void;
}

export function RuleComposer({ input, editing, full, placeholder, storageAvailable, api, editableRules, disabled = false, preparing = false, onInput, onQueue, onApplyCurrent, onCancel }: RuleComposerProps) {
  return (
    <section className="composer-dock glass" aria-label="Write a rule">
      <div className="dock-heading">
        <label htmlFor="message-input">{editing ? 'EDIT YOUR MESSAGE' : 'REWRITE A RULE'}</label>
        <span className={`connection-dot ${api.configured ? 'connected' : ''}`}
          title={api.configured ? `AI ready · ${api.model}` : 'Local commands available'} />
        {editing && <button className="quiet-button" onClick={onCancel}>Cancel</button>}
      </div>
      {editableRules && <AllowedRules rules={editableRules} />}
      <textarea id="message-input" value={input} maxLength={240} placeholder={placeholder} disabled={disabled}
        onChange={event => onInput(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.nativeEvent.keyCode!==229) {
            event.preventDefault();
            if(disabled || !input.trim() || (!editing && full))return;
            if(event.shiftKey) {
              if(!preparing)onApplyCurrent?.();
            } else onQueue();
          }
        }} />
      <div className="composer-bottom">
        <span className="composer-shortcuts">
          <span><kbd>Enter</kbd> queue</span>
          <span><kbd>Shift+Enter</kbd> apply now</span>
        </span>
        <button className="queue-button" disabled={disabled || !input.trim() || (!editing && full)} onClick={onQueue}>
          {editing ? 'Save' : 'Queue message'} ↳
        </button>
      </div>
      {!storageAvailable && <p className="inline-error">Storage is unavailable. Keep this tab open.</p>}
    </section>
  );
}
