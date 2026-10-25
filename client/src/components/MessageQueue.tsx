import { type Message } from '../domain/queue';
import { MessageCard } from './MessageCard';
import type { LevelDefinition } from '../levels/types';

interface MessageQueueProps {
  level: LevelDefinition;
  messages: Message[];
  selected: Set<string>;
  managing: boolean;
  preparing: boolean;
  ended: boolean;
  canSend: boolean;
  messageErrors: Record<string, string>;
  canUndo: boolean;
  apiConfigured: boolean;
  previewError: string;
  onToggleManage: () => void;
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onEdit: (message: Message) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onSend: (ids: string[]) => void;
  onQueueAgain: (text: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onPrepare: () => void;
  onLoadExample: () => void;
  onCancelPreparation?: () => void;
  onPrepareMessage?: (id:string) => void;
}

export function MessageQueue(props: MessageQueueProps) {
  const { messages, selected, managing, preparing, ended, canSend, canUndo, apiConfigured, previewError } = props;
  const pending = messages.filter(message => message.status !== 'sent');
  const sent = messages.filter(message => message.status === 'sent');
  const ready = messages.filter(message => message.status === 'ready');
  const chosen = ready.filter(message => selected.has(message.id));
  const renderMessage = (message: Message, index: number) => (
    <MessageCard key={message.id} level={props.level} message={message} index={index} count={pending.length}
      managing={managing} selected={selected.has(message.id)} preparing={preparing}
      canSend={canSend && !props.messageErrors[message.id]} validationError={props.messageErrors[message.id]}
      onSelect={props.onSelect} onEdit={props.onEdit} onDelete={props.onDelete}
      onMove={props.onMove} onSend={props.onSend} onPrepare={props.onPrepareMessage} />
  );

  return (
    <section className={`queue-dock glass ${managing ? 'expanded' : ''}`} aria-label="Message queue">
      <div className="dock-heading">
        <span>YOUR NEXT MOVE <small>{pending.length}</small></span>
        <button className="quiet-button" aria-expanded={managing} onClick={props.onToggleManage}>
          {managing ? 'Done' : 'Manage'}
        </button>
      </div>
      {preparing && <div className="queue-preparation" role="status"><span>Reading a message · game paused</span>
        <button className="quiet-button" onClick={props.onCancelPreparation}>Cancel</button></div>}
      {pending.length ? <div className="pending-list">{pending.map(renderMessage)}</div> : (
        <div className="empty-queue">
          <p>{sent.length ? 'What changes next?' : 'A different world starts with a message.'}</p>
          <span>Queue a rule below. Send it when you choose.</span>
          {!messages.length && <button className="quiet-button starter-button" onClick={props.onLoadExample}>
            Load starter messages ↳
          </button>}
        </div>
      )}
      {managing && (
        <div className="queue-management">
          <p>Selected messages apply together, in queue order.</p>
          <div className="button-row">
            <button className="small-button" disabled={!ready.length}
              onClick={() => props.onSelectAll(ready.map(message => message.id))}>Select ready</button>
            <button className="small-button" disabled={!chosen.length || ended || !!previewError}
              onClick={() => props.onSend(chosen.map(message => message.id))}>Send all selected</button>
          </div>
          <details>
            <summary>Sent messages · {sent.length}</summary>
            {sent.map(message => <div className="history-item" key={message.id}>
              <p>{message.text}</p>
              <button className="quiet-button" disabled={messages.length >= 24}
                onClick={() => props.onQueueAgain(message.text)}>Queue again</button>
            </div>)}
          </details>
          <div className="button-row">
            <button className="quiet-button" disabled={!canUndo || ended || preparing} onClick={props.onUndo}>Undo last rule</button>
            <button className="quiet-button" onClick={props.onClear}>Clear messages</button>
          </div>
          <button className="quiet-button" disabled={!apiConfigured || preparing || !pending.length}
            onClick={props.onPrepare}>Prepare all with AI</button>
        </div>
      )}
      {previewError && <p className="inline-error">{previewError}</p>}
    </section>
  );
}
