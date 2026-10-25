import { useEffect, useState } from 'react';
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
import { LevelOnboarding } from '../components/LevelOnboarding';
import { levelLabel } from '../levels/progression';

interface GameProps {
  level: LevelDefinition;
  chooseLevel: (id: string) => void;
  onTitle?: () => void;
  onLevelSelect?: () => void;
  onCompleted?: (id: string, stars: number) => void;
}

export function Game({ level, chooseLevel, onTitle, onLevelSelect, onCompleted }: GameProps) {
  const game = useGameSession(level);
  const { queue, controls, telemetry, world, onboarding } = game;
  const [showRules, setShowRules] = useState(false);
  const allowedRules = editableRuleLabels(level);
  useEffect(() => {
    if (telemetry.won) onCompleted?.(level.id, telemetry.stars.collected);
  }, [level.id, telemetry.won, telemetry.stars.collected, onCompleted]);

  return (
    <main className={`game-shell ${level.presentation === 'bakery' ? 'bakery-theme' : ''}${game.absorbing ? ' game-shell--absorbing' : ''}`}>
      <canvas className="game-canvas" ref={game.canvasRef} width={level.viewport.width} height={level.viewport.height}
        role="img" aria-label={level.instructions.sceneDescription} />
      <div className="gameplay-interface" inert={onboarding.visible || undefined}>
      <GameHud level={level} telemetry={telemetry} secondsLeft={game.secondsLeft} menuOpen={controls.menuOpen}
        onRetry={game.retryWorld} onResume={controls.resumeGame} onOpenMenu={controls.openMenu} onTitle={onTitle} />
      <div className="game-rule-controls" inert={game.absorbing || undefined}>
      <MessageQueue messages={queue.messages} selected={queue.selected} managing={queue.managing}
        preparing={queue.preparing} ended={game.ended} canSend={game.canSend} messageErrors={game.messageErrors} canUndo={game.canUndo}
        apiConfigured={queue.api.configured} previewError={game.previewError}
        onToggleManage={queue.toggleManaging} onSelect={queue.toggleSelection} onSelectAll={queue.selectMessages}
        onEdit={queue.editMessage} onDelete={queue.removeMessage} onMove={queue.moveMessage} onSend={game.send}
        onQueueAgain={queue.queueAgain} onUndo={game.undoLastRule} onClear={queue.clearMessages}
        onPrepare={() => queue.prepareQueue()} onLoadExample={queue.loadExample}
        onCancelPreparation={queue.cancelPreparation} onPrepareMessage={id=>queue.prepareQueue({messageId:id})} />
      <RuleComposer input={queue.input} editing={!!queue.editing} full={queue.messages.length >= 24}
        disabled={game.absorbing || onboarding.visible}
        editableRules={allowedRules}
        placeholder={`e.g. ${level.instructions.suggestedMessages[0]}`} api={queue.api}
        storageAvailable={queue.storageAvailable} onInput={queue.setInput} onQueue={game.queueInput}
        onApplyCurrent={game.applyCurrent} preparing={queue.preparing}
        onCancel={queue.cancelEditing} />
      </div>
      <RuleCaption captions={game.captions} finish={game.finishCaption} />
      <div className="bottom-hud">
        <button className="quiet-button" disabled={game.absorbing || onboarding.visible} aria-expanded={showRules} onClick={() => setShowRules(!showRules)}>
          {showRules ? 'Close rules' : 'Rules & hints'} ⌁
        </button>
        <span data-testid="active-gravity">
          {accelerationLabel(telemetry.acceleration)}
        </span>
        <span>{game.stateLabel}</span>
      </div>
      {showRules && !game.absorbing && <RulesDrawer level={level} acceleration={telemetry.acceleration} rules={world?.rules}
        commandCount={world?.commandCount || 0} onClose={() => setShowRules(false)}
        onSuggest={queue.setInput} onLoadExample={queue.loadExample} />}
      <p className="game-toast" role="status" title={game.notice}>{game.notice}</p>
      {game.tutorial && !controls.menuOpen && <TeachingOverlay tutorial={game.tutorial}
        preparing={queue.preparing} onContinue={game.continueTutorial} />}
      {level.instructions.timingLesson && !game.ended && !onboarding.visible && <TimingHint lesson={level.instructions.timingLesson} hasMessages={!!queue.messages.length} telemetry={telemetry} />}
      {(controls.menuOpen || game.ended) && !game.absorbing && <GameMenu level={level} telemetry={telemetry} preparing={queue.preparing}
        onChooseLevel={chooseLevel} onResume={controls.resumeGame} onRetry={game.retryWorld}
        onReset={game.resetWorld} onReplayTeaching={game.replayTeaching}
        onTitle={onTitle} onLevelSelect={onLevelSelect}
        onHowToPlay={onboarding.lesson ? game.showHowToPlay : undefined} />}
      </div>
      {onboarding.visible && onboarding.lesson && <LevelOnboarding lesson={onboarding.lesson} levelLabel={levelLabel(level)} levelTitle={level.title}
        editableRules={allowedRules}
        onClose={() => onboarding.close()} onLoadStarters={game.loadOnboardingStarters} />}
    </main>
  );
}
