import React from 'react';
import { useCharacterStageStore, STAGE_ORDER, type CharacterStage } from '../../../stores/characterStageStore';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba60',
  coral: '#f04e4e',
  cream: '#d8c8b8',
  creamMuted: '#d8c8b840',
};

const STAGE_LABELS: Record<CharacterStage, string> = {
  configure: 'Configure',
  describe: 'Describe',
  identity: 'Identity',
  canvas: 'Canvas',
  finalise: 'Finalise',
};

const STAGE_NUMBERS: Record<CharacterStage, string> = {
  configure: '01',
  describe: '02',
  identity: '03',
  canvas: '04',
  finalise: '05',
};

export const StageBreadcrumb: React.FC = () => {
  const {
    currentStage,
    completedStages,
    goToStage,
    canNavigateTo,
    isTransitioning,
  } = useCharacterStageStore();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    padding: '12px 24px',
    backgroundColor: colors.bgSecondary,
    borderBottom: `1px solid ${colors.mintMuted}`,
  };

  const getStageStyle = (stage: CharacterStage): React.CSSProperties => {
    const isCurrent = stage === currentStage;
    const isCompleted = completedStages.has(stage);
    const isAccessible = canNavigateTo(stage);

    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      fontFamily: 'monospace',
      fontSize: '13px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: isAccessible && !isTransitioning ? 'var(--cursor-pointer)' : 'default',
      opacity: isAccessible ? 1 : 0.4,
      color: isCurrent ? colors.coral : isCompleted ? colors.mint : colors.cream,
      backgroundColor: isCurrent ? `${colors.coral}15` : 'transparent',
      border: isCurrent ? `1px solid ${colors.coral}40` : '1px solid transparent',
      transition: 'all 0.2s ease',
      position: 'relative',
    };
  };

  const numberStyle = (stage: CharacterStage): React.CSSProperties => {
    const isCurrent = stage === currentStage;
    const isCompleted = completedStages.has(stage);

    return {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontWeight: 'bold',
      color: isCurrent ? colors.coral : isCompleted ? colors.mint : colors.creamMuted,
      marginRight: '4px',
    };
  };

  const separatorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: colors.mintMuted,
    padding: '0 4px',
    userSelect: 'none',
  };

  const checkmarkStyle: React.CSSProperties = {
    fontSize: '12px',
    marginLeft: '6px',
  };

  const handleStageClick = (stage: CharacterStage) => {
    if (canNavigateTo(stage) && !isTransitioning) {
      goToStage(stage);
    }
  };

  // Corner bracket pseudo-elements for current stage
  const cornerBracketCSS = `
    .stage-item-current::before,
    .stage-item-current::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      border-color: ${colors.coral};
      border-style: solid;
    }
    .stage-item-current::before {
      top: -1px;
      left: -1px;
      border-width: 2px 0 0 2px;
    }
    .stage-item-current::after {
      bottom: -1px;
      right: -1px;
      border-width: 0 2px 2px 0;
    }
  `;

  return (
    <>
      <style>{cornerBracketCSS}</style>
      <nav style={containerStyle} aria-label="Character creation stages">
        {STAGE_ORDER.map((stage, index) => {
          const isCurrent = stage === currentStage;
          const isCompleted = completedStages.has(stage);

          return (
            <React.Fragment key={stage}>
              <button
                className={isCurrent ? 'stage-item-current' : ''}
                style={getStageStyle(stage)}
                onClick={() => handleStageClick(stage)}
                disabled={!canNavigateTo(stage) || isTransitioning}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${STAGE_LABELS[stage]}${isCompleted ? ' (completed)' : ''}${isCurrent ? ' (current)' : ''}`}
              >
                <span style={numberStyle(stage)}>{STAGE_NUMBERS[stage]}</span>
                <span>{STAGE_LABELS[stage]}</span>
                {isCompleted && !isCurrent && (
                  <span style={checkmarkStyle} aria-hidden="true">
                    +
                  </span>
                )}
              </button>

              {index < STAGE_ORDER.length - 1 && (
                <span style={separatorStyle} aria-hidden="true">
                  {'>'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

export default StageBreadcrumb;
