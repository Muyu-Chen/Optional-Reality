import { describeOperation } from '../../../shared/commands';
import { messageOperations, type Message } from '../domain/queue';

interface MessageCardProps {
  message: Message;
  index: number;
  count: number;
  managing: boolean;
  selected: boolean;
  preparing: boolean;
  canSend: boolean;
  onSelect: (id: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onSend: (ids: string[]) => void;
}

export function MessageCard({ message, index, count, managing, selected, preparing, canSend,
  onSelect, onEdit, onDelete, onMove, onSend }: MessageCardProps) {
  const operations = messageOperations(message);
  const status = message.status === 'draft' ? preparing ? 'Interpreting…' : 'Waiting'
    : message.status === 'error' ? 'Needs editing' : 'Ready';
  const description = operations.length
    ? operations.map(operation => describeOperation(operation).title).join(' · ')
    : message.status === 'draft' ? 'Interpreting your rule…' : message.error || 'Your rule is being prepared.';

  return (
    <article className={`queued-message ${index === 0 ? 'current-message' : 'upcoming-message'} ${message.status}`}>
      <div className="message-copy">
        <div className="message-meta">
          {managing && <input type="checkbox" aria-label={`Select message ${index + 1}`}
            checked={selected} disabled={message.status !== 'ready'} onChange={() => onSelect(message.id)} />}
          <span>{index === 0 ? 'UP NEXT' : String(index + 1).padStart(2, '0')}</span>
          <span>{status}</span>
        </div>
        <p className="message-text">{message.text}</p>
        {message.understoodAs && <p className="parsed-rule">Understood as: {message.understoodAs}</p>}
        <p className={`parsed-rule ${message.status === 'error' ? 'error-copy' : ''}`}>{description}</p>
        {(managing || message.status === 'error') && (
          <div className="message-actions">
            <button aria-label={`Edit message ${index + 1}`} onClick={() => onEdit(message)}>Edit</button>
            <button aria-label={`Delete message ${index + 1}`} onClick={() => onDelete(message.id)}>Delete</button>
            {managing && <>
              <button aria-label={`Move message ${index + 1} earlier`} disabled={index === 0}
                onClick={() => onMove(message.id, -1)}>↑</button>
              <button aria-label={`Move message ${index + 1} later`} disabled={index === count - 1}
                onClick={() => onMove(message.id, 1)}>↓</button>
            </>}
          </div>
        )}
      </div>
      {index === 0 && <button className="send-now" disabled={!canSend || message.status !== 'ready'}
        onClick={() => onSend([message.id])}>Send now <span aria-hidden="true">↗</span></button>}
    </article>
  );
}
