import { useCallback, useEffect, useRef, useState } from 'react';
import { applyRules } from '../../shared/rules';
import { applyBatch, messageOperations, prepareMessage, retryMessages, type AppliedEvent, type Message } from './domain/queue';
import { gravityLab } from './levels/gravity-lab';
import { findLevel } from './levels/catalog';
import type { LevelDefinition } from './levels/types';
import { initialRules, ruleContext } from './levels/rules';
import { appliedFeedback } from './domain/feedback';
import { RuleCaption, type Caption } from './components/RuleCaption';
import { compilerStatus, prepareWithAI } from './api/compiler';
import { CanvasLab } from './physics/canvas-lab';
import { initialTelemetry, STEP_MS, type Telemetry } from './physics/world';

import { GameHud } from './components/GameHud';
import { MessageQueue } from './components/MessageQueue';
import { RuleComposer } from './components/RuleComposer';
import { RulesDrawer } from './components/RulesDrawer';
import { GameMenu } from './components/GameMenu';
import { TeachingOverlay, TimingHint } from './components/TeachingOverlay';

const id = () => crypto.randomUUID();
function loadMessages(level: LevelDefinition): Message[] {
  const STORAGE_KEY = `optional-reality.${level.id}.messages.v1`;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((text): text is string => typeof text === 'string' && text.length > 0 && text.length <= 240)
      .slice(0, 24).map(text => prepareMessage(id(), text, ruleContext(level), initialRules(level)));
  } catch { return []; }
}
function acceleration(value: number) { return `${Math.abs(value).toFixed(1)} m/s²`; }

export default function App() {
  const [level, setLevel] = useState(() => findLevel(new URLSearchParams(window.location.search).get('level') || '') || gravityLab);
  function chooseLevel(levelId: string) {
    const next = findLevel(levelId);
    if (!next) return;
    const url = new URL(window.location.href);
    url.searchParams.set('level', next.id); window.history.replaceState(null, '', url);
    setLevel(next);
  }
  return <Experiment key={level.id} level={level} chooseLevel={chooseLevel}/>;
}

function Experiment({ level, chooseLevel }: { level: LevelDefinition; chooseLevel: (levelId: string) => void }) {
  const context = ruleContext(level);
  const STORAGE_KEY = `optional-reality.${level.id}.messages.v1`;
  const localMessage = (messageId: string, text: string) => prepareMessage(messageId, text, context, initialRules(level));
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(level));
  const messageRef = useRef(messages);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [telemetry, setTelemetry] = useState<Telemetry>(() => initialTelemetry(level));
  const [events, setEvents] = useState<AppliedEvent[]>([]);
  const [notice, setNotice] = useState(`${level.initialGravity === 0 ? 'Zero gravity.' : `Initial gravity = ${level.initialGravity} m/s².`} Your first sent message starts the ${level.timeLimitSeconds}-second experiment.`);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [api, setApi] = useState({ configured: false, model: '' });
  const [preparing, setPreparing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const finishCaption = useCallback((captionId: string) => setCaptions(previous => previous.filter(caption => caption.id !== captionId)), []);
  const requestRef = useRef<AbortController | null>(null);
  const queueRevision = useRef(0);
  const sceneVersion = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labRef = useRef<CanvasLab | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    document.title = `${level.title} — Optional Reality`;
    const lab = new CanvasLab(canvasRef.current, level, setTelemetry, true);
    labRef.current = lab;
    return () => { lab.destroy(); labRef.current = null; };
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(message => message.text))); }
    catch { setStorageAvailable(false); }
  }, [messages]);
  useEffect(() => {
    const controller = new AbortController();
    compilerStatus(controller.signal).then(setApi).catch(() => {});
    return () => { controller.abort(); requestRef.current?.abort(); };
  }, []);
  useEffect(() => {
    if (api.configured && !preparing && messages.some(message => message.status === 'draft')) void prepareQueue(true);
  }, [messages, api.configured, preparing]);
  useEffect(() => {
    if(api.configured && messageRef.current.some(message=>message.status === 'error' && message.requiresAI)) {
      updateMessages(messageRef.current.map(message=>message.status === 'error' && message.requiresAI ? {...message,status:'draft',error:undefined} : message));
    }
  }, [api.configured]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (menuOpen) { resumeGame(); return; }
      if (!labRef.current?.world.won && !labRef.current?.world.timedOut) openMenu();
    }
    window.addEventListener('keydown',handleEscape);
    return () => window.removeEventListener('keydown',handleEscape);
  }, [menuOpen, preparing]);

  function openMenu() { labRef.current?.world.pause(); labRef.current?.report(); setMenuOpen(true); }
  function resumeGame() {
    if (!preparing && labRef.current?.world.started) labRef.current.world.start();
    labRef.current?.report(); setMenuOpen(false);
  }
  function updateMessages(next: Message[]) {
    requestRef.current?.abort(); requestRef.current = null; setPreparing(false);
    queueRevision.current++;
    messageRef.current = next; setMessages(next);
  }
  function toggleSelection(messageId: string) {
    setSelected(previous => { const next = new Set(previous); next.has(messageId) ? next.delete(messageId) : next.add(messageId); return next; });
  }
  function queueMessage() {
    const text = input.trim();
    if (!text) return;
    if (!editing && messageRef.current.length >= 24) { setNotice('The demo holds 24 messages. Remove a message to add another.'); return; }
    const entry = localMessage(editing || id(), text);
    if (entry.status === 'error' && entry.requiresAI && api.configured) entry.status = 'draft';
    const next = editing ? messageRef.current.map(message => message.id === editing ? entry : message) : [...messageRef.current, entry];
    updateMessages(next);
    if (editing) setSelected(previous => new Set([...previous].filter(value => value !== editing)));
    setInput(''); setEditing(null);
    setNotice(entry.status === 'ready' ? 'Message queued. Choose Send now when ready.' : api.configured ? 'Interpreting your message…' : 'Saved. Connect the AI service or use a starter command.');
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
    if (!lab || preparing || lab.world.won || lab.world.timedOut) return;
    try {
      const result = applyBatch(messageRef.current, ids, lab.world.rules, lab.world.tick, context);
      let captionState = lab.world.rules;
      const captionGroup=id();
      const feedback = result.events.map(event => {
        const after = applyRules(captionState,event.operations,context);
        const lines = appliedFeedback(event.operations,captionState,after,level); captionState = after;
        return {id:id(),lines,group:captionGroup};
      });
      lab.world.applyMessages(result.events.map(event => ({ text: event.text, operations: event.operations })));
      setCaptions(previous => [...previous,...feedback]);
      lab.world.start(); setMenuOpen(false);
      updateMessages(result.messages);
      setEvents(previous => [...previous, ...result.events]);
      setSelected(previous => new Set([...previous].filter(value => !ids.includes(value))));
      lab.report();
      const rule = result.gravity === 0 ? 'gravity = 0' : `${result.gravity > 0 ? 'downward' : 'upward'} gravity, a = ${acceleration(result.gravity)}`;
      const changesOnlyGravity = result.events.every(event => event.operations.every(operation => operation.type === 'set_gravity' || operation.type === 'reverse_gravity'));
      setNotice(`${ids.length === 1 ? 'Message sent' : `${ids.length} messages sent in queue order`}. ${changesOnlyGravity ? `Now ${rule}.` : 'Environment rules applied.'}${lab.world.running ? '' : lab.world.tutorialId ? ' Choose Continue when ready.' : ' Resume to see the result.'}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'The batch could not be sent.'); }
  }
  function toggleSimulation() {
    const lab = labRef.current;
    if (!lab || preparing || !lab.world.started || lab.world.won || lab.world.timedOut) return;
    if (lab.world.running) { lab.world.pause(); setNotice('Simulation paused. You can still prepare and send messages.'); }
    else { lab.world.start(); setNotice(lab.world.gravity === 0 ? 'Simulation running with zero gravity. Send a prepared message to change it.' : 'Simulation resumed. Your next message is waiting for you.'); }
    lab.report();
  }
  function resetWorld() {
    sceneVersion.current++;
    labRef.current?.reset();
    updateMessages(messageRef.current.map(message => localMessage(message.id, message.text)));
    setSelected(new Set()); setEvents([]); setMenuOpen(false); setCaptions([]);
    setNotice('World reset. Messages kept; prepare AI messages again before sending.');
  }
  function retryWorld() {
    if (!labRef.current) return;
    sceneVersion.current++;
    updateMessages(retryMessages(messageRef.current));
    labRef.current.reset(); setEvents([]); setSelected(new Set()); setMenuOpen(false); setCaptions([]);
    setNotice('Same world. Same messages. Try a different timing.');
  }
  function undoLastRule() {
    const lab = labRef.current, last = events.at(-1);
    if (!lab || !last || preparing || lab.world.won || lab.world.timedOut) return;
    if(!messageRef.current.some(message=>message.id === last.id) && messageRef.current.length>=24){setNotice('Remove a message before returning the last rule to the queue.');return;}
    if(!lab.world.undoRule())return;
    const restored: Message = { id: last.id, text: last.text, status: 'ready', operations: last.operations };
    updateMessages(messageRef.current.some(message => message.id === last.id)
      ? messageRef.current.map(message => message.id === last.id ? { ...message, status: 'ready' } : message)
      : [...messageRef.current, restored]);
    setEvents(previous => previous.slice(0,-1)); setSelected(new Set()); lab.report();
    setNotice('Last rule undone. The message is ready again; the bread or ball keeps its current motion.');
  }
  function loadExample() {
    updateMessages(level.instructions.exampleMessages.map(text => localMessage(id(), text)));
    setSelected(new Set()); setEditing(null); setInput('');
    setNotice(level.instructions.exampleNotice);
  }
  async function prepareQueue(onlyDrafts = false) {
    const lab = labRef.current;
    if (!lab || preparing || requestRef.current) return;
    const pending = messageRef.current.filter(message => onlyDrafts ? message.status === 'draft' : message.status !== 'sent');
    if (!pending.length) return;
    lab.world.pause(); lab.report();
    const controller = new AbortController();
    requestRef.current = controller; setPreparing(true);
    const request = {
      requestId: id(), levelId: level.id, sceneVersion: sceneVersion.current, queueRevision: queueRevision.current,
      messages: pending.map(({ id, text }) => ({ id, text })), rules: structuredClone(lab.world.rules),
    };
    setNotice('Preparing messages with AI. The experiment is paused; rules stay unchanged.');
    try {
      const result = await prepareWithAI(request, controller.signal);
      if (controller.signal.aborted || requestRef.current !== controller || sceneVersion.current !== request.sceneVersion || queueRevision.current !== request.queueRevision) return;
      let preview = lab.world.rules;
      for (const message of result.messages) preview = applyRules(preview, message.operations, context);
      const compiled = new Map(result.messages.map(message => [message.id, message.operations]));
      updateMessages(messageRef.current.map(message => compiled.has(message.id) ? {
        id: message.id, text: message.text, status: 'ready', operations: compiled.get(message.id), source: 'ai',
      } : message));
      setNotice('AI preparation complete. Review the parsed rules, then send when ready. The experiment remains paused.');
    } catch (error) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const reason = error instanceof Error ? error.message : 'AI preparation failed. Edit the message and try again.';
      const failed = new Set(pending.filter(message => message.status === 'draft').map(message => message.id));
      if (failed.size) updateMessages(messageRef.current.map(message => failed.has(message.id) ? { ...message, status: 'error', error: reason } : message));
      setNotice(reason);
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setPreparing(false); }
    }
  }

  const chosen = messages.filter(message => selected.has(message.id) && message.status === 'ready');
  const pending = messages.filter(message => message.status !== 'sent');
  const toSend = chosen.length ? chosen : pending.slice(0,1).filter(message => message.status === 'ready');
  let previewError = '';
  try { let preview = labRef.current?.world.rules || initialRules(level); for (const message of toSend) preview = applyRules(preview, messageOperations(message), context); }
  catch (error) { previewError = error instanceof Error ? error.message : 'Rules need preparing again.'; }
  const ended = telemetry.won || telemetry.timedOut;
  const canSend = !ended && !preparing && !previewError && toSend.length > 0;
  const stateLabel = telemetry.won ? 'Complete' : telemetry.fell ? 'Try again' : telemetry.timedOut ? 'Time’s up' : telemetry.tutorialId ? 'Learning' : telemetry.running ? 'Running' : telemetry.started ? 'Paused' : 'Ready';
  const secondsLeft = Math.max(0, Math.ceil(level.timeLimitSeconds - telemetry.tick * STEP_MS / 1000));

  const isBakery = level.presentation === 'bakery';
  const world = labRef.current?.world;
  const tutorial = level.tutorials?.find(item => item.id === telemetry.tutorialId);
  return <main className={`game-shell ${isBakery ? 'bakery-theme' : ''}`}>
    <canvas className="game-canvas" ref={canvasRef} width={level.viewport.width} height={level.viewport.height} role="img" aria-label={level.instructions.sceneDescription}/>
    <GameHud level={level} telemetry={telemetry} secondsLeft={secondsLeft} menuOpen={menuOpen}
      onRetry={retryWorld} onResume={resumeGame} onOpenMenu={openMenu} />
    <MessageQueue messages={messages} selected={selected} managing={managing} preparing={preparing}
      ended={ended} canSend={canSend} canUndo={!!events.length} apiConfigured={api.configured} previewError={previewError}
      onToggleManage={() => { setManaging(!managing); setSelected(new Set()); }}
      onSelect={toggleSelection} onSelectAll={ids => setSelected(new Set(ids))}
      onEdit={message => { setEditing(message.id); setInput(message.text); }}
      onDelete={removeMessage} onMove={moveMessage} onSend={send}
      onQueueAgain={text => updateMessages([...messageRef.current, localMessage(id(), text)])}
      onUndo={undoLastRule} onClear={() => { updateMessages([]); setSelected(new Set()); }}
      onPrepare={() => prepareQueue()} onLoadExample={loadExample} />
    <RuleComposer input={input} editing={!!editing} full={messages.length >= 24}
      placeholder={`e.g. ${level.instructions.suggestedMessages[0]}`} api={api} storageAvailable={storageAvailable}
      onInput={setInput} onQueue={queueMessage} onCancel={() => { setEditing(null); setInput(''); }} />
    <RuleCaption captions={captions} finish={finishCaption} />
    <div className="bottom-hud">
      <button className="quiet-button" aria-expanded={showRules} onClick={() => setShowRules(!showRules)}>
        {showRules ? 'Close rules' : 'Rules & hints'} ⌁
      </button>
      <span data-testid="active-gravity">{telemetry.gravity === 0 ? 'g = 0' : `g ${telemetry.gravity > 0 ? '↓' : '↑'} ${Math.abs(telemetry.gravity).toFixed(1)} m/s²`}</span>
      <span>{stateLabel}</span>
    </div>
    {showRules && <RulesDrawer level={level} gravity={telemetry.gravity} rules={world?.rules}
      commandCount={world?.commandCount || 0} onClose={() => setShowRules(false)}
      onSuggest={setInput} onLoadExample={loadExample} />}
    <p className="game-toast" role="status" title={notice}>{notice}</p>
    {tutorial && !menuOpen && <TeachingOverlay tutorial={tutorial} preparing={preparing} onContinue={() => {
      labRef.current?.world.continueTutorial();
      labRef.current?.report();
      setNotice('The toaster is charging. Your timing changes what happens next.');
    }} />}
    {level.number === 1 && !ended && <TimingHint hasMessages={!!messages.length} telemetry={telemetry} />}
    {(menuOpen || ended) && <GameMenu level={level} telemetry={telemetry} preparing={preparing}
      onChooseLevel={chooseLevel} onResume={resumeGame} onRetry={retryWorld} onReset={resetWorld}
      onReplayTeaching={() => {
        retryWorld();
        labRef.current?.world.seenTutorials.clear();
        setNotice('Teaching reset. Send your setup to encounter the toaster again.');
      }} />}
  </main>;
}
