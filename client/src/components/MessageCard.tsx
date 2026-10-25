import type { LevelDefinition } from '../levels/types';
import { scopedRulePreview } from '../domain/rule-scope';
import { messageOperations, type Message } from '../domain/queue';
import { RulePreview } from './RulePreview';

interface MessageCardProps {
  level: LevelDefinition;
  message: Message;
  index: number;
  count: number;
  managing: boolean;
  selected: boolean;
  preparing: boolean;
  canSend: boolean;
  validationError?: string;
  onSelect: (id: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onSend: (ids: string[]) => void;
  onPrepare?: (id: string) => void;
}

export function MessageCard({ level, message, index, count, managing, selected, preparing, canSend, validationError,
  onSelect, onEdit, onDelete, onMove, onSend, onPrepare }: MessageCardProps) {
  const operations = messageOperations(message);
  const status = message.status === 'draft' ? preparing ? 'Interpreting…' : 'Waiting'
    : message.status === 'error' ? 'Needs editing' : 'Ready';
  const description = operations.length
    ? scopedRulePreview(operations, level)
    : message.status === 'draft' ? preparing ? 'Interpreting your rule…' : 'Choose Prepare when you are ready.' : message.error || 'Your rule is being prepared.';

  return (
    <article className={`queued-message ${index === 0 ? 'current-message' : 'upcoming-message'} ${message.status}`}>
      <div className="message-copy">
        <div className="message-header">
        <div className="message-meta">
          {managing && <input type="checkbox" aria-label={`Select message ${index + 1}`}
            checked={selected} disabled={message.status !== 'ready'} onChange={() => onSelect(message.id)} />}
          <span>{index === 0 ? 'UP NEXT' : String(index + 1).padStart(2, '0')}</span>
          <span>{status}</span>
        </div>
        <div className="message-quick-actions">
          {message.status==='draft' && !preparing && onPrepare ? <button className="send-now" disabled={!canSend}
            onClick={() => onPrepare(message.id)}>Prepare</button> : <button className="send-now" disabled={!canSend || message.status !== 'ready'}
            onClick={() => onSend([message.id])}>Send now</button>}
          <button className="delete-message" aria-label={`Delete message ${index + 1}`} title="Delete message"
            onClick={() => onDelete(message.id)}>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M3 4.5h10M6 4.5v-2h4v2M4 4.5l.7 9h6.6l.7-9M6.5 7v4M9.5 7v4" />
            </svg>
          </button>
        </div>
        </div>
        <p className="message-text" title={message.text}>{message.text}</p>
        <RulePreview operations={operations} description={description} error={message.status==='error'} />
        <details className="message-details" open={managing || undefined}>
          <summary aria-label={`Details for message ${index+1}`} title="View full message and parsed rule">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </summary>
          <p className="message-full-text">{message.text}</p>
          {message.understoodAs && <p className="parsed-rule">Understood as: {message.understoodAs}</p>}
          {message.adjustments?.map((adjustment,i) => <p className="parsed-rule" key={i}>
            Requested {adjustment.requested} → limited to {adjustment.applied} (range {adjustment.minimum} to {adjustment.maximum})
          </p>)}
          <p className="parsed-rule">{description}</p>
        </details>
        {validationError && <p className="parsed-rule error-copy">{validationError}</p>}
        {(managing || message.status === 'error') && (
          <div className="message-actions">
            <button aria-label={`Edit message ${index + 1}`} onClick={() => onEdit(message)}>Edit</button>
            {managing && <>
              <button aria-label={`Move message ${index + 1} earlier`} disabled={index === 0}
                onClick={() => onMove(message.id, -1)}>↑</button>
              <button aria-label={`Move message ${index + 1} later`} disabled={index === count - 1}
                onClick={() => onMove(message.id, 1)}>↓</button>
            </>}
          </div>
        )}
      </div>
    </article>
  );
}
