import { useState } from 'react';
import { accelerationLabel } from '../../../shared/acceleration';
import { GameHud } from '../components/GameHud';
import { GameMenu } from '../components/GameMenu';
import { MessageQueue } from '../components/MessageQueue';
import { RuleCaption } from '../components/RuleCaption';
import { RuleComposer } from '../components/RuleComposer';
import { RulesDrawer } from '../components/RulesDrawer';
import { TeachingOverlay, TimingHint } from '../components/TeachingOverlay';
import type { LevelDefinition } from '../levels/types';
import { editableRuleLabels } from '../levels/presentation';
import { useGameSession } from './useGameSession';

export function Game({ level, chooseLevel }: { level: LevelDefinition; chooseLevel: (id: string) => void }) {
  const game = useGameSession(level);
  const { queue, controls, telemetry, world } = game;
  const [showRules, setShowRules] = useState(false);

  return (
    <main className={`game-shell ${level.presentation === 'bakery' ? 'bakery-theme' : ''}`}>
      <canvas className="game-canvas" ref={game.canvasRef} width={level.viewport.width} height={level.viewport.height}
        role="img" aria-label={level.instructions.sceneDescription} />
      <GameHud level={level} telemetry={telemetry} secondsLeft={game.secondsLeft} menuOpen={controls.menuOpen}
        onRetry={game.retryWorld} onResume={controls.resumeGame} onOpenMenu={controls.openMenu} />
      <MessageQueue messages={queue.messages} selected={queue.selected} managing={queue.managing}
        preparing={queue.preparing} ended={game.ended} canSend={game.canSend} messageErrors={game.messageErrors} canUndo={game.canUndo}
        apiConfigured={queue.api.configured} previewError={game.previewError}
        onToggleManage={queue.toggleManaging} onSelect={queue.toggleSelection} onSelectAll={queue.selectMessages}
        onEdit={queue.editMessage} onDelete={queue.removeMessage} onMove={queue.moveMessage} onSend={game.send}
        onQueueAgain={queue.queueAgain} onUndo={game.undoLastRule} onClear={queue.clearMessages}
        onPrepare={() => queue.prepareQueue()} onLoadExample={queue.loadExample} />
      <RuleComposer input={queue.input} editing={!!queue.editing} full={queue.messages.length >= 24}
        editableRules={editableRuleLabels(level)}
        placeholder={`e.g. ${level.instructions.suggestedMessages[0]}`} api={queue.api}
        storageAvailable={queue.storageAvailable} onInput={queue.setInput} onQueue={queue.queueMessage}
        onCancel={queue.cancelEditing} />
      <RuleCaption captions={game.captions} finish={game.finishCaption} />
      <div className="bottom-hud">
        <button className="quiet-button" aria-expanded={showRules} onClick={() => setShowRules(!showRules)}>
          {showRules ? 'Close rules' : 'Rules & hints'} ⌁
        </button>
        <span data-testid="active-gravity">
          {accelerationLabel(telemetry.acceleration)}
        </span>
        <span>{game.stateLabel}</span>
      </div>
      {showRules && <RulesDrawer level={level} acceleration={telemetry.acceleration} rules={world?.rules}
        commandCount={world?.commandCount || 0} onClose={() => setShowRules(false)}
        onSuggest={queue.setInput} onLoadExample={queue.loadExample} />}
      <p className="game-toast" role="status" title={game.notice}>{game.notice}</p>
      {game.tutorial && !controls.menuOpen && <TeachingOverlay tutorial={game.tutorial}
        preparing={queue.preparing} onContinue={game.continueTutorial} />}
      {level.instructions.timingLesson && !game.ended && <TimingHint lesson={level.instructions.timingLesson} hasMessages={!!queue.messages.length} telemetry={telemetry} />}
      {(controls.menuOpen || game.ended) && <GameMenu level={level} telemetry={telemetry} preparing={queue.preparing}
        onChooseLevel={chooseLevel} onResume={controls.resumeGame} onRetry={game.retryWorld}
        onReset={game.resetWorld} onReplayTeaching={game.replayTeaching} />}
    </main>
  );
}
