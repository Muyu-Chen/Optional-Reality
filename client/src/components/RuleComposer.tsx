interface RuleComposerProps {
  input: string;
  editing: boolean;
  full: boolean;
  placeholder: string;
  storageAvailable: boolean;
  api: { configured: boolean; model: string };
  onInput: (text: string) => void;
  onQueue: () => void;
  onCancel: () => void;
}

export function RuleComposer({ input, editing, full, placeholder, storageAvailable, api, onInput, onQueue, onCancel }: RuleComposerProps) {
  return (
    <section className="composer-dock glass" aria-label="Write a rule">
      <div className="dock-heading">
        <label htmlFor="message-input">{editing ? 'EDIT YOUR MESSAGE' : 'REWRITE A RULE'}</label>
        <span className={`connection-dot ${api.configured ? 'connected' : ''}`}
          title={api.configured ? `AI ready · ${api.model}` : 'Local commands available'} />
        {editing && <button className="quiet-button" onClick={onCancel}>Cancel</button>}
      </div>
      <textarea id="message-input" value={input} maxLength={240} placeholder={placeholder}
        onChange={event => onInput(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onQueue();
          }
        }} />
      <div className="composer-bottom">
        <span>Enter to queue · Send now to apply</span>
        <button className="queue-button" disabled={!input.trim() || (!editing && full)} onClick={onQueue}>
          {editing ? 'Save' : 'Queue message'} ↳
        </button>
      </div>
      {!storageAvailable && <p className="inline-error">Storage is unavailable. Keep this tab open.</p>}
    </section>
  );
}
