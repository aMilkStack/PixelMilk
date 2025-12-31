import React, { useEffect, useState } from 'react';
import { useCharacterStageStore, type CharacterStage } from '../../../stores/characterStageStore';
import { useCharacterStore } from '../../../stores';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
};

type AnimationState = 'entering' | 'centered' | 'exiting-left' | 'exited-left';

interface StageAnimationState {
  configure: AnimationState;
  describe: AnimationState;
  identity: AnimationState;
  canvas: AnimationState;
  finalise: AnimationState;
}

interface StageContainerProps {
  children: {
    configure: React.ReactNode;
    describe: React.ReactNode;
    identity: React.ReactNode;
    canvas: React.ReactNode;
    finalise: React.ReactNode;
  };
}

export const StageContainer: React.FC<StageContainerProps> = ({ children }) => {
  const { currentStage, completedStages, isTransitioning } = useCharacterStageStore();

  // Track animation states for each stage
  const [animationStates, setAnimationStates] = useState<StageAnimationState>({
    configure: 'centered',
    describe: 'entering',
    identity: 'entering',
    canvas: 'entering',
    finalise: 'entering',
  });

  // Update animation states when stage changes
  useEffect(() => {
    const stages: CharacterStage[] = ['configure', 'describe', 'identity', 'canvas', 'finalise'];
    const currentIndex = stages.indexOf(currentStage);

    setAnimationStates((prev) => {
      const newStates = { ...prev };

      stages.forEach((stage, index) => {
        if (index < currentIndex) {
          // Completed stages - docked to left
          newStates[stage] = 'exited-left';
        } else if (index === currentIndex) {
          // Current stage - centered
          newStates[stage] = 'centered';
        } else {
          // Future stages - not yet visible
          newStates[stage] = 'entering';
        }
      });

      return newStates;
    });
  }, [currentStage]);

  // Full page modes = canvas and finalise (no assembly view)
  const isFullPageMode = currentStage === 'canvas' || currentStage === 'finalise';

  const containerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bgPrimary,
  };

  // Assembly view - shows docked stages on left, centered stage in middle
  const assemblyViewStyle: React.CSSProperties = {
    display: isFullPageMode ? 'none' : 'flex',
    width: '100%',
    height: '100%',
  };

  // Left dock area - shows completed stages as compact summaries
  const hasCompletedStages = completedStages.size > 0;
  const leftDockStyle: React.CSSProperties = {
    width: hasCompletedStages ? '320px' : '0',
    minWidth: hasCompletedStages ? '320px' : '0',
    height: '100%',
    borderRight: hasCompletedStages ? `1px solid ${colors.mintMuted}` : 'none',
    backgroundColor: colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    overflow: 'hidden',
    opacity: hasCompletedStages ? 1 : 0,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Center stage area - where active stage is displayed
  const centerStageStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    overflow: 'auto',
  };

  // Canvas view - full page
  const canvasViewStyle: React.CSSProperties = {
    display: currentStage === 'canvas' ? 'flex' : 'none',
    width: '100%',
    height: '100%',
  };

  // Finalise view - full page centered
  const finaliseViewStyle: React.CSSProperties = {
    display: currentStage === 'finalise' ? 'flex' : 'none',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    overflow: 'auto',
  };

  const getStageWrapperStyle = (
    stage: CharacterStage,
    position: 'dock' | 'center'
  ): React.CSSProperties => {
    const animState = animationStates[stage];
    const isCurrentStage = currentStage === stage;
    const isCompleted = completedStages.has(stage);

    if (position === 'dock') {
      // Docked (completed) stage style
      return {
        padding: '16px',
        backgroundColor: colors.bgSecondary,
        borderBottom: `1px solid ${colors.mintMuted}`,
        opacity: isCompleted && !isCurrentStage ? 1 : 0,
        maxHeight: isCompleted && !isCurrentStage ? '200px' : '0',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    // Centered (active) stage style
    return {
      width: '100%',
      maxWidth: '600px',
      opacity: isCurrentStage ? 1 : 0,
      transform: isCurrentStage
        ? 'translateX(0) scale(1)'
        : animState === 'exited-left'
        ? 'translateX(-50px) scale(0.95)'
        : 'translateX(50px) scale(0.95)',
      pointerEvents: isCurrentStage ? 'auto' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: isCurrentStage ? 'relative' : 'absolute',
    };
  };

  // Full page mode for canvas and finalise
  if (isFullPageMode) {
    return (
      <div style={containerStyle}>
        <div style={canvasViewStyle}>{children.canvas}</div>
        <div style={finaliseViewStyle}>{children.finalise}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Assembly View */}
      <div style={assemblyViewStyle}>
        {/* Left Dock - Completed stages as compact summaries */}
        <div style={leftDockStyle}>
          <div style={getStageWrapperStyle('configure', 'dock')}>
            <DockedStageSummary stage="configure" />
          </div>
          <div style={getStageWrapperStyle('describe', 'dock')}>
            <DockedStageSummary stage="describe" />
          </div>
        </div>

        {/* Center Stage - Active stage */}
        <div style={centerStageStyle}>
          <div style={getStageWrapperStyle('configure', 'center')}>
            {children.configure}
          </div>
          <div style={getStageWrapperStyle('describe', 'center')}>
            {children.describe}
          </div>
          <div style={getStageWrapperStyle('identity', 'center')}>
            {children.identity}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact summary for docked (completed) stages
interface DockedStageSummaryProps {
  stage: 'configure' | 'describe';
}

const DockedStageSummary: React.FC<DockedStageSummaryProps> = ({ stage }) => {
  const { goToStage } = useCharacterStageStore();

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.mint,
  };

  const editButtonStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.mint,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.mintMuted}`,
    padding: '4px 8px',
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const summaryStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#d8c8b8',
    lineHeight: 1.4,
  };

  const titles: Record<'configure' | 'describe', string> = {
    configure: 'Style Config',
    describe: 'Description',
  };

  return (
    <div>
      <div style={headerStyle}>
        <span style={titleStyle}>{titles[stage]}</span>
        <button
          style={editButtonStyle}
          onClick={() => goToStage(stage)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${colors.mint}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Edit
        </button>
      </div>
      <div style={summaryStyle}>
        {stage === 'configure' && <ConfigureSummary />}
        {stage === 'describe' && <DescribeSummary />}
      </div>
    </div>
  );
};

// Summaries connected to character store
const ConfigureSummary: React.FC = () => {
  const { styleParams } = useCharacterStore();

  const parts: string[] = [];
  if (styleParams.canvasSize) parts.push(`${styleParams.canvasSize}px`);
  if (styleParams.outlineStyle) {
    const outlineLabel = styleParams.outlineStyle === 'black' ? 'Black Outline' :
                         styleParams.outlineStyle === 'colored' ? 'Coloured Outline' :
                         styleParams.outlineStyle === 'selective' ? 'Selective Outline' :
                         styleParams.outlineStyle === 'lineless' ? 'Lineless' : styleParams.outlineStyle;
    parts.push(outlineLabel);
  }
  if (styleParams.shadingStyle) {
    const shadingLabel = styleParams.shadingStyle.charAt(0).toUpperCase() + styleParams.shadingStyle.slice(1);
    parts.push(shadingLabel);
  }

  return <span>{parts.join(' / ') || 'Not configured'}</span>;
};

const DescribeSummary: React.FC = () => {
  const { description } = useCharacterStore();

  return (
    <span
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {description || 'No description yet'}
    </span>
  );
};

export default StageContainer;
