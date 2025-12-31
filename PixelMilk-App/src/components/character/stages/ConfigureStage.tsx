import React from 'react';
import { StyleSelector } from '../StyleSelector';
import { useCharacterStore } from '../../../stores';
import { useCharacterStageStore } from '../../../stores/characterStageStore';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  coral: '#f04e4e',
  coralMuted: '#f04e4e40',
  cream: '#d8c8b8',
};

export const ConfigureStage: React.FC = () => {
  const { styleParams, setStyleParams } = useCharacterStore();
  const { nextStage, isTransitioning } = useCharacterStageStore();

  const handleNext = () => {
    nextStage();
  };

  // Check if config is valid (has required fields set)
  const isConfigValid = styleParams.canvasSize && styleParams.outlineStyle;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    position: 'relative',
  };

  // Corner bracket framing for active panel
  const panelStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mintMuted}`,
    padding: '32px',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '62px',
    fontWeight: 700,
    color: colors.mint,
    letterSpacing: '0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: colors.cream,
    opacity: 0.7,
    lineHeight: 1.5,
  };

  const stepIndicatorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.coral,
    marginBottom: '4px',
  };

  const ctaButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px 32px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: isConfigValid ? colors.coral : colors.coralMuted,
    border: `2px solid ${isConfigValid ? colors.coral : colors.coralMuted}`,
    color: isConfigValid ? colors.bgPrimary : colors.cream,
    cursor: isConfigValid && !isTransitioning ? 'var(--cursor-pointer)' : 'not-allowed',
    opacity: isTransitioning ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.mintMuted}`,
    marginTop: '8px',
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.cream,
    opacity: 0.5,
  };

  // Corner bracket CSS
  const cornerBracketCSS = `
    .configure-panel::before,
    .configure-panel::after,
    .configure-panel .corner-bl,
    .configure-panel .corner-tr {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: ${colors.coral};
      border-style: solid;
      pointer-events: none;
    }
    .configure-panel::before {
      top: -1px;
      left: -1px;
      border-width: 3px 0 0 3px;
    }
    .configure-panel::after {
      bottom: -1px;
      right: -1px;
      border-width: 0 3px 3px 0;
    }
    .configure-panel .corner-tr {
      top: -1px;
      right: -1px;
      border-width: 3px 3px 0 0;
    }
    .configure-panel .corner-bl {
      bottom: -1px;
      left: -1px;
      border-width: 0 0 3px 3px;
    }
  `;

  return (
    <>
      <style>{cornerBracketCSS}</style>
      <div style={containerStyle}>
        <div className="configure-panel" style={panelStyle}>
          {/* Corner bracket elements */}
          <span className="corner-tr" />
          <span className="corner-bl" />

          {/* Header */}
          <div style={headerStyle}>
            <span style={stepIndicatorStyle}>Step 01</span>
            <h2 style={titleStyle}>Configure Style</h2>
            <p style={subtitleStyle}>
              Set the visual parameters for your character sprite. These settings
              will guide the AI's artistic decisions.
            </p>
          </div>

          {/* Style Options */}
          <StyleSelector
            value={styleParams}
            onChange={setStyleParams}
            disabled={isTransitioning}
          />

          {/* Footer with CTA */}
          <div style={footerStyle}>
            <span style={hintStyle}>
              Press Enter or click Next to continue
            </span>
          </div>
        </div>

        {/* CTA Button - Outside panel for emphasis */}
        <button
          style={ctaButtonStyle}
          onClick={handleNext}
          disabled={!isConfigValid || isTransitioning}
          onMouseEnter={(e) => {
            if (isConfigValid && !isTransitioning) {
              e.currentTarget.style.backgroundColor = '#ff6b6b';
              e.currentTarget.style.borderColor = '#ff6b6b';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (isConfigValid && !isTransitioning) {
              e.currentTarget.style.backgroundColor = colors.coral;
              e.currentTarget.style.borderColor = colors.coral;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span>Continue to Description</span>
          <span style={{ fontSize: '16px' }}>{'>'}</span>
        </button>
      </div>
    </>
  );
};

export default ConfigureStage;
