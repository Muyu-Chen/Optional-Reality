import { useCallback, useMemo, useState } from 'react';
import { applyRules } from '../../../shared/rules';
import { appliedFeedback } from '../domain/feedback';
import { applyBatch, messageOperations, retryMessages, type AppliedEvent, type Message } from '../domain/queue';
import type { Caption } from '../components/RuleCaption';
import type { LevelDefinition } from '../levels/types';
import { initialRules, ruleContext } from '../levels/rules';
import { STEP_MS, type Telemetry } from '../physics/world';
import { useGameControls } from './useGameControls';
import { useGameWorld } from './useGameWorld';
import { useMessageQueue } from './useMessageQueue';

// Coordinates the queue and world at player action boundaries, never on every physics tick.
export function useGameSession(level: LevelDefinition) {
  const context = useMemo(() => ruleContext(level), [level]);
  const [notice, setNotice] = useState(`${level.initialGravity === 0 ? 'Zero gravity.' : `Initial gravity = ${level.initialGravity} m/s².`} Your first sent message starts the ${level.timeLimitSeconds}-second experiment.`);
  const { canvasRef, labRef, telemetry } = useGameWorld(level);
  const queue = useMessageQueue(level, labRef, setNotice);
  const controls = useGameControls(labRef, queue.preparing);
  const [events, setEvents] = useState<AppliedEvent[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const finishCaption = useCallback((id: string) => {
    setCaptions(previous => previous.filter(caption => caption.id !== id));
  }, []);

  function send(ids: string[]) {
    const lab = labRef.current;
    if (!lab || queue.preparing || lab.world.won || lab.world.timedOut) return;
    try {
      const result = applyBatch(queue.messageRef.current, ids, lab.world.rules, lab.world.tick, context);
      let captionState = lab.world.rules;
      const group = crypto.randomUUID();
      const feedback = result.events.map(event => {
        const after = applyRules(captionState, event.operations, context);
        const lines = appliedFeedback(event.operations, captionState, after, level);
        captionState = after;
        return { id: crypto.randomUUID(), lines, group };
      });
      lab.world.applyMessages(result.events.map(event => ({ text: event.text, operations: event.operations })));
      setCaptions(previous => [...previous, ...feedback]);
      lab.world.start();
      controls.setMenuOpen(false);
      queue.updateMessages(result.messages);
      setEvents(previous => [...previous, ...result.events]);
      queue.clearSelection(ids);
      lab.report();
      const rule = result.gravity === 0 ? 'gravity = 0'
        : `${result.gravity > 0 ? 'downward' : 'upward'} gravity, a = ${Math.abs(result.gravity).toFixed(1)} m/s²`;
      const changesOnlyGravity = result.events.every(event => event.operations.every(operation => (
        operation.type === 'set_gravity' || operation.type === 'reverse_gravity'
      )));
      setNotice(`${ids.length === 1 ? 'Message sent' : `${ids.length} messages sent in queue order`}. ${changesOnlyGravity ? `Now ${rule}.` : 'Environment rules applied.'}${lab.world.running ? '' : lab.world.tutorialId ? ' Choose Continue when ready.' : ' Resume to see the result.'}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The batch could not be sent.');
    }
  }

  function clearAttemptFeedback() {
    setEvents([]);
    setCaptions([]);
    queue.clearSelection();
    controls.setMenuOpen(false);
  }

  function resetWorld() {
    queue.invalidateScene();
    labRef.current?.reset();
    queue.updateMessages(queue.messageRef.current.map(message => queue.localMessage(message.id, message.text)));
    clearAttemptFeedback();
    setNotice('World reset. Messages kept; prepare AI messages again before sending.');
  }

  function retryWorld() {
    if (!labRef.current) return;
    queue.invalidateScene();
    queue.updateMessages(retryMessages(queue.messageRef.current));
    labRef.current.reset();
    clearAttemptFeedback();
    setNotice('Same world. Same messages. Try a different timing.');
  }

  function undoLastRule() {
    const lab = labRef.current, last = events.at(-1);
    if (!lab || !last || queue.preparing || lab.world.won || lab.world.timedOut) return;
    if (!queue.messageRef.current.some(message => message.id === last.id) && queue.messageRef.current.length >= 24) {
      setNotice('Remove a message before returning the last rule to the queue.');
      return;
    }
    if (!lab.world.undoRule()) return;
    const restored: Message = { id: last.id, text: last.text, status: 'ready', operations: last.operations };
    queue.updateMessages(queue.messageRef.current.some(message => message.id === last.id)
      ? queue.messageRef.current.map(message => message.id === last.id ? { ...message, status: 'ready' } : message)
      : [...queue.messageRef.current, restored]);
    setEvents(previous => previous.slice(0, -1));
    queue.clearSelection();
    lab.report();
    setNotice('Last rule undone. The message is ready again; the bread or ball keeps its current motion.');
  }

  function continueTutorial() {
    labRef.current?.world.continueTutorial();
    labRef.current?.report();
    setNotice('The toaster is charging. Your timing changes what happens next.');
  }

  function replayTeaching() {
    retryWorld();
    labRef.current?.world.seenTutorials.clear();
    setNotice('Teaching reset. Send your setup to encounter the toaster again.');
  }

  const chosen = queue.messages.filter(message => queue.selected.has(message.id) && message.status === 'ready');
  const pending = queue.messages.filter(message => message.status !== 'sent');
  const toSend = chosen.length ? chosen : pending.slice(0, 1).filter(message => message.status === 'ready');
  let previewError = '';
  try {
    let preview = labRef.current?.world.rules || initialRules(level);
    for (const message of toSend) preview = applyRules(preview, messageOperations(message), context);
  } catch (error) {
    previewError = error instanceof Error ? error.message : 'Rules need preparing again.';
  }
  const ended = telemetry.won || telemetry.timedOut;
  return {
    canvasRef, telemetry, queue, controls, notice, captions, finishCaption,
    world: labRef.current?.world,
    canUndo: !!events.length, ended, previewError,
    canSend: !ended && !queue.preparing && !previewError && toSend.length > 0,
    stateLabel: gameStateLabel(telemetry),
    secondsLeft: Math.max(0, Math.ceil(level.timeLimitSeconds - telemetry.tick * STEP_MS / 1000)),
    tutorial: level.tutorials?.find(item => item.id === telemetry.tutorialId),
    send, resetWorld, retryWorld, undoLastRule, continueTutorial, replayTeaching,
  };
}

function gameStateLabel(telemetry: Telemetry) {
  return telemetry.won ? 'Complete' : telemetry.fell ? 'Try again' : telemetry.timedOut ? 'Time’s up'
    : telemetry.tutorialId ? 'Learning' : telemetry.running ? 'Running' : telemetry.started ? 'Paused' : 'Ready';
}
