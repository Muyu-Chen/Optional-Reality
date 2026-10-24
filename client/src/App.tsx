import { useEffect, useRef, useState } from 'react';
import { applyOperation, describeOperation } from '../../shared/commands';
import { applyBatch, prepareMessage, type AppliedEvent, type Message } from './domain/queue';
import { CanvasLab, ROUND_SECONDS, STEP_MS, type Telemetry } from './physics/world';

const STORAGE_KEY = 'optional-reality.gravity-lab.messages.v1';
const INITIAL: Telemetry = { running: false, started: false, gravity: 0, tick: 0, won: false, timedOut: false, x: 165, y: 135 };
const id = () => crypto.randomUUID();
function loadMessages(): Message[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((text): text is string => typeof text === 'string' && text.length > 0 && text.length <= 240)
      .slice(0, 24).map(text => prepareMessage(id(), text));
  } catch { return []; }
}
function acceleration(value: number) { return `${Math.abs(value).toFixed(1)} m/s²`; }
function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' | 'up' }) {
  return <span aria-hidden="true">{direction === 'right' ? '↗' : direction === 'down' ? '↓' : '↑'}</span>;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const messageRef = useRef(messages);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [telemetry, setTelemetry] = useState<Telemetry>(INITIAL);
  const [events, setEvents] = useState<AppliedEvent[]>([]);
  const [notice, setNotice] = useState('Zero gravity. Your first sent message starts the 30-second experiment.');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labRef = useRef<CanvasLab | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const lab = new CanvasLab(canvasRef.current, setTelemetry);
    labRef.current = lab;
    return () => { lab.destroy(); labRef.current = null; };
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(message => message.text))); }
    catch { setStorageAvailable(false); }
  }, [messages]);

  function updateMessages(next: Message[]) { messageRef.current = next; setMessages(next); }
  function toggleSelection(messageId: string) {
    setSelected(previous => { const next = new Set(previous); next.has(messageId) ? next.delete(messageId) : next.add(messageId); return next; });
  }
  function queueMessage() {
    const text = input.trim();
    if (!text) return;
    if (!editing && messageRef.current.length >= 24) { setNotice('The demo holds 24 messages. Remove a message to add another.'); return; }
    const entry = prepareMessage(editing || id(), text);
    const next = editing ? messageRef.current.map(message => message.id === editing ? entry : message) : [...messageRef.current, entry];
    updateMessages(next);
    if (editing) setSelected(previous => new Set([...previous].filter(value => value !== editing)));
    setInput(''); setEditing(null);
    setNotice(entry.status === 'ready' ? 'Message saved and parsed. Its rule will only apply when you send it.' : 'Message saved. Edit it to use a command recognised by this demo.');
  }
  function removeMessage(messageId: string) {
    updateMessages(messageRef.current.filter(message => message.id !== messageId));
    setSelected(previous => new Set([...previous].filter(value => value !== messageId)));
    if (editing === messageId) { setEditing(null); setInput(''); }
  }
  function moveMessage(messageId: string, direction: -1 | 1) {
    const next = [...messageRef.current];
    const pending = next.map((message, index) => message.status !== 'sent' ? index : -1).filter(index => index >= 0);
    const from = next.findIndex(message => message.id === messageId);
    const position = pending.indexOf(from);
    const to = pending[position + direction];
    if (to === undefined) return;
    [next[from], next[to]] = [next[to], next[from]];
    updateMessages(next);
  }
  function send(ids: string[]) {
    const lab = labRef.current;
    if (!lab || lab.world.won || lab.world.timedOut) return;
    try {
      const result = applyBatch(messageRef.current, ids, lab.world.gravity, lab.world.tick);
      lab.world.setGravity(result.gravity);
      if (!lab.world.started) lab.world.start();
      updateMessages(result.messages);
      setEvents(previous => [...previous, ...result.events]);
      setSelected(previous => new Set([...previous].filter(value => !ids.includes(value))));
      lab.report();
      const rule = result.gravity === 0 ? 'gravity = 0' : `${result.gravity > 0 ? 'downward' : 'upward'} gravity, a = ${acceleration(result.gravity)}`;
      setNotice(`${ids.length === 1 ? 'Message sent' : `${ids.length} messages sent in queue order`}. Now ${rule}.${lab.world.running ? '' : ' Resume to see the result.'}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'The batch could not be sent.'); }
  }
  function toggleSimulation() {
    const lab = labRef.current;
    if (!lab || !lab.world.started || lab.world.won || lab.world.timedOut) return;
    if (lab.world.running) { lab.world.pause(); setNotice('Simulation paused. You can still prepare and send messages.'); }
    else { lab.world.start(); setNotice(lab.world.gravity === 0 ? 'Simulation running with zero gravity. Send a prepared message to change it.' : 'Simulation resumed. Your next message is waiting for you.'); }
    lab.report();
  }
  function resetWorld() {
    labRef.current?.reset();
    updateMessages(messageRef.current.map(message => prepareMessage(message.id, message.text)));
    setSelected(new Set()); setEvents([]);
    setNotice('World reset to zero gravity. Your messages are kept and ready for another run.');
  }
  function loadExample() {
    updateMessages(['add gravity', 'stop gravity'].map(text => prepareMessage(id(), text)));
    setNotice('Two messages prepared. Send the first to begin; send the second when the ball leaves the track.');
  }

  const ready = messages.filter(message => message.status === 'ready');
  const chosen = messages.filter(message => selected.has(message.id) && message.status === 'ready');
  const toSend = chosen.length ? chosen : ready.slice(0, 1);
  let batchGravity = telemetry.gravity;
  for (const message of toSend) if (message.operation) batchGravity = applyOperation(batchGravity, message.operation);
  const ended = telemetry.won || telemetry.timedOut;
  const canSend = !ended && toSend.length > 0;
  const pending = messages.filter(message => message.status !== 'sent');
  const stateLabel = telemetry.won ? 'Complete' : telemetry.timedOut ? 'Time’s up' : telemetry.running ? 'Running' : telemetry.started ? 'Paused' : 'Ready';
  const secondsLeft = Math.max(0, Math.ceil(ROUND_SECONDS - telemetry.tick * STEP_MS / 1000));

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="/"><span className="brand-symbol" aria-hidden="true">o<span>r</span></span>Optional Reality</a>
      <div className="header-links"><span className="demo-badge"><span className="dot"/> INTERACTIVE DEMO</span><a href="/">Project home <Arrow/></a></div>
    </header>
    <main>
      <div className="lab-heading"><div><p className="eyebrow">01 / GRAVITY LAB</p><h1>Your messages. Your physics.</h1><p className="intro">Prepare your messages. Send the first to begin.</p></div><div className="parser-note"><span className="small-orbit" aria-hidden="true">✳</span><div><strong>Local parser demo</strong><span>Three commands. No model API yet.</span></div></div></div>
      <div className="workbench">
        <section className="panel messages-panel" aria-labelledby="messages-title">
          <div className="panel-heading"><div><p className="eyebrow">01 / PREPARE</p><h2 id="messages-title">Message queue <span className="count">{messages.length}</span></h2></div><button className="text-button" disabled={!messages.length} onClick={() => { updateMessages([]); setSelected(new Set()); setEditing(null); setInput(''); setNotice('Message queue cleared. The world is unchanged.'); }}>Clear</button></div>
          {messages.length > 0 && <div className="selection-toolbar"><span>{chosen.length ? `${chosen.length} selected` : `${ready.length} ready`}</span><button className="text-button" disabled={!ready.length} onClick={() => setSelected(chosen.length ? new Set() : new Set(ready.map(message => message.id)))}>{chosen.length ? 'Clear selection' : 'Select all ready'}</button></div>}
          <div className="queue-list">
            {!messages.length && <div className="empty-queue"><span className="empty-symbol" aria-hidden="true">↳</span><h3>Write first.<br/>Send later.</h3><p>Your messages stay here until you choose to apply them.</p><button className="outline-button" onClick={loadExample}>Load two-step example <span aria-hidden="true">+</span></button></div>}
            {messages.map((message, index) => {
              const number = String(index + 1).padStart(2, '0');
              const pendingIndex = pending.findIndex(item => item.id === message.id);
              return <article className={`message-card ${selected.has(message.id) ? 'selected' : ''} ${toSend.some(item => item.id === message.id) && !ended ? 'next-message' : ''} ${message.status}`} key={message.id}>
                <div className="message-top"><label className="selection-label"><input type="checkbox" aria-label={`Select message ${number}`} disabled={message.status !== 'ready'} checked={selected.has(message.id)} onChange={() => toggleSelection(message.id)}/><span>MESSAGE {number}</span></label><span className={`status-tag ${message.status}`}>{message.status === 'error' ? 'Edit needed' : message.status === 'sent' ? 'Sent' : 'Ready'}</span></div>
                <p className="message-content">{message.text}</p>
                <div className={`message-rule ${message.status === 'error' ? 'error-copy' : ''}`}><span aria-hidden="true">↳</span><p>{message.operation ? <><strong>{describeOperation(message.operation).title}</strong><span>{describeOperation(message.operation).detail}</span></> : message.error}</p></div>
                <div className="message-actions">{message.status !== 'sent' ? <><button aria-label={`Move message ${number} earlier`} disabled={pendingIndex <= 0} onClick={() => moveMessage(message.id, -1)}>↑</button><button aria-label={`Move message ${number} later`} disabled={pendingIndex === pending.length - 1} onClick={() => moveMessage(message.id, 1)}>↓</button><button className="edit-button" onClick={() => { setEditing(message.id); setInput(message.text); }}>Edit</button></> : <button className="edit-button" disabled={messages.length >= 24} onClick={() => updateMessages([...messageRef.current, prepareMessage(id(), message.text)])}>Queue again</button>}<button className="delete-button" aria-label={`Delete message ${number}`} onClick={() => removeMessage(message.id)}>×</button></div>
              </article>;
            })}
          </div>
          <div className="send-controls">
            {toSend.length > 0 && <p className="send-preview">{toSend.length > 1 ? 'Batch result' : 'On send'}: <strong>{batchGravity === 0 ? 'gravity = 0' : `${batchGravity > 0 ? 'downward' : 'upward'} · ${acceleration(batchGravity)}`}</strong>{toSend.length > 1 && <span>Applied in queue order, with no time between messages.</span>}</p>}
            <button className="primary-button send-button" disabled={!canSend} onClick={() => send(toSend.map(message => message.id))}>{chosen.length > 1 ? 'Send all selected' : 'Send next message'} <Arrow/></button>
            <p className="send-hint">{ended ? 'Reset to try another run.' : !telemetry.started ? 'Your first send starts the 30-second countdown.' : telemetry.running ? 'Send when the moment is right.' : 'Paused. Resume to see the result.'}</p>
          </div>
          <div className="composer">
            <div className="composer-label"><label htmlFor="message-input">{editing ? 'Edit your message' : 'Describe a rule'}</label>{editing && <button className="text-button" onClick={() => { setEditing(null); setInput(''); }}>Cancel</button>}</div>
            <textarea id="message-input" value={input} maxLength={240} placeholder="e.g. add gravity" onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); queueMessage(); } }}/>
            <div className="suggestions">{['add gravity', 'stop gravity', 'reverse gravity'].map(text => <button key={text} onClick={() => setInput(text)}>{text}</button>)}</div>
            <button className="primary-button queue-button" disabled={!input.trim() || (!editing && messages.length >= 24)} onClick={queueMessage}>{editing ? 'Save message' : 'Add to queue'} <span aria-hidden="true">↳</span></button>
            <p className="storage-note">{storageAvailable ? 'Saved on this device. Reload resets the experiment.' : 'Browser storage unavailable. Keep this tab open to retain messages.'}</p>
          </div>
        </section>

        <section className="panel simulation-panel" aria-labelledby="simulation-title">
          <div className="panel-heading"><div><p className="eyebrow">02 / OBSERVE</p><h2 id="simulation-title">The experiment</h2></div><span className={`world-status ${telemetry.running ? 'running' : ''}`}><span className="dot"/>{stateLabel}</span></div>
          <div className="gravity-readout"><div><span className="readout-label">ACTIVE GRAVITY</span><strong data-testid="active-gravity">{telemetry.gravity === 0 ? '0' : `${telemetry.gravity > 0 ? '↓' : '↑'} ${Math.abs(telemetry.gravity).toFixed(1)}`} <small>m/s²</small></strong></div><div className={`countdown ${secondsLeft <= 5 ? 'urgent' : ''}`}><span className="readout-label">TIME LEFT</span><strong data-testid="time-left">{secondsLeft}<small> s</small></strong></div></div>
          <div className="canvas-frame"><canvas ref={canvasRef} aria-label="Live physics scene with a floating ball, a curved track, and an exit. The world starts with zero gravity." role="img"/></div>
          <div className="simulation-controls"><div><button className="outline-button" onClick={toggleSimulation} disabled={!telemetry.started || ended}>{telemetry.started && !telemetry.running ? '▶ Resume' : 'Ⅱ Pause'}</button><button className="reset-button" onClick={resetWorld}>↺ Reset</button></div><span className="tick-label">{events.length} {events.length === 1 ? 'message' : 'messages'} sent</span></div>
          <div className={`mission ${telemetry.won ? 'completed' : ''} ${telemetry.timedOut ? 'expired' : ''}`}><span aria-hidden="true">{telemetry.won ? '✓' : telemetry.timedOut ? '↺' : '↗'}</span><div><strong>{telemetry.won ? 'You reached the exit.' : telemetry.timedOut ? 'Time’s up. Try another timing.' : 'Touch the exit within 30 seconds.'}</strong><p>{telemetry.won || telemetry.timedOut ? 'Reset to try again with the same messages.' : 'Send “add gravity” to begin. Send “stop gravity” as the ball leaves the track.'}</p></div></div>
        </section>
      </div>
      <div className="notice" role="status" aria-live="polite"><span className="dot"/>{telemetry.won ? 'Experiment complete. You controlled the timing.' : telemetry.timedOut ? 'Time’s up. Reset to try again; your messages are saved.' : notice}</div>
    </main>
    <footer><span>Optional Reality / Gravity Lab</span><span>Acceleration changes. Momentum remains.</span></footer>
  </div>;
}
