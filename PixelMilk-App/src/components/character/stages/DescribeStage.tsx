import React, { useState, useCallback } from 'react';
import { DescriptionInput } from '../DescriptionInput';
import { Button } from '../../shared';
import { useCharacterStore, useAppStore } from '../../../stores';
import { useCharacterStageStore } from '../../../stores/characterStageStore';
import { describeImageForPixelArt, optimizePrompt } from '../../../services/gemini';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  coral: '#f04e4e',
  coralMuted: '#f04e4e40',
  cream: '#d8c8b8',
  forbidden: '#ff6b9d',
};

const MIN_DESCRIPTION_LENGTH = 10;

export const DescribeStage: React.FC = () => {
  const {
    description,
    setDescription,
    styleParams,
    referenceImage,
    referenceImageName,
    setReferenceImage,
    clearReferenceImage,
    setError,
  } = useCharacterStore();
  const { apiKey, openApiKeyModal } = useAppStore();
  const { nextStage, previousStage, isTransitioning } = useCharacterStageStore();

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDescribingImage, setIsDescribingImage] = useState(false);
  const [hasForbiddenWords, setHasForbiddenWords] = useState(false);

  // Description is valid if it meets minimum length AND has no forbidden words
  const isDescriptionValid =
    description.trim().length >= MIN_DESCRIPTION_LENGTH && !hasForbiddenWords;

  const handleNext = () => {
    if (isDescriptionValid) {
      nextStage();
    }
  };

  const handleBack = () => {
    previousStage();
  };

  // Enhance description using AI
  const handleEnhance = useCallback(async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await optimizePrompt(description, styleParams.canvasSize);
      if (result.optimizedPrompt) {
        setDescription(result.optimizedPrompt);
      }
    } catch (err) {
      setError('Failed to enhance description');
    } finally {
      setIsEnhancing(false);
    }
  }, [apiKey, openApiKeyModal, description, styleParams.canvasSize, setDescription, setError]);

  // Handle reference image upload
  const handleReferenceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      setReferenceImage(base64Data, file.name);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [setReferenceImage, setError]);

  // Handle describe image - use AI to generate description from reference
  const handleDescribeImage = useCallback(async () => {
    if (!referenceImage) return;

    setIsDescribingImage(true);
    try {
      const generatedDescription = await describeImageForPixelArt(referenceImage);
      if (generatedDescription) {
        setDescription(description ? `${description}\n\n${generatedDescription}` : generatedDescription);
      }
    } catch (err) {
      setError('Failed to describe image');
    } finally {
      setIsDescribingImage(false);
    }
  }, [referenceImage, description, setDescription, setError]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    position: 'relative',
  };

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

  // Style summary badge
  const styleSummaryStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.mintMuted}`,
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.cream,
    opacity: 0.8,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    width: '100%',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: 'transparent',
    border: `2px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: isTransitioning ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: isTransitioning ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  // Determine button state: forbidden takes priority for visual feedback
  const meetsLengthRequirement = description.trim().length >= MIN_DESCRIPTION_LENGTH;
  const isBlockedByForbidden = hasForbiddenWords && meetsLengthRequirement;

  const ctaButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    flex: 1,
    padding: '16px 32px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: isDescriptionValid
      ? colors.coral
      : isBlockedByForbidden
        ? colors.forbidden + '30'
        : colors.coralMuted,
    border: `2px solid ${
      isDescriptionValid
        ? colors.coral
        : isBlockedByForbidden
          ? colors.forbidden + '60'
          : colors.coralMuted
    }`,
    color: isDescriptionValid
      ? colors.bgPrimary
      : isBlockedByForbidden
        ? colors.forbidden
        : colors.cream,
    cursor: isDescriptionValid && !isTransitioning ? 'var(--cursor-pointer)' : 'not-allowed',
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
    .describe-panel::before,
    .describe-panel::after,
    .describe-panel .corner-bl,
    .describe-panel .corner-tr {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: ${colors.coral};
      border-style: solid;
      pointer-events: none;
    }
    .describe-panel::before {
      top: -1px;
      left: -1px;
      border-width: 3px 0 0 3px;
    }
    .describe-panel::after {
      bottom: -1px;
      right: -1px;
      border-width: 0 3px 3px 0;
    }
    .describe-panel .corner-tr {
      top: -1px;
      right: -1px;
      border-width: 3px 3px 0 0;
    }
    .describe-panel .corner-bl {
      bottom: -1px;
      left: -1px;
      border-width: 0 0 3px 3px;
    }
  `;

  // Build style summary text
  const getStyleSummary = () => {
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
    return parts.join(' / ');
  };

  return (
    <>
      <style>{cornerBracketCSS}</style>
      <div style={containerStyle}>
        <div className="describe-panel" style={panelStyle}>
          {/* Corner bracket elements */}
          <span className="corner-tr" />
          <span className="corner-bl" />

          {/* Header */}
          <div style={headerStyle}>
            <span style={stepIndicatorStyle}>Step 02</span>
            <h2 style={titleStyle}>Describe Character</h2>
            <p style={subtitleStyle}>
              Paint a picture with words. The more vivid your description,
              the more distinctive your character will become.
            </p>
          </div>

          {/* Style Summary Badge */}
          <div style={{ marginBottom: '20px' }}>
            <div style={styleSummaryStyle}>
              <span style={{ color: colors.mint, fontWeight: 'bold' }}>Style:</span>
              <span>{getStyleSummary()}</span>
            </div>
          </div>

          {/* Description Input */}
          <DescriptionInput
            value={description}
            onChange={setDescription}
            disabled={isTransitioning}
            onEnhance={handleEnhance}
            isEnhancing={isEnhancing}
            onForbiddenWordsChange={setHasForbiddenWords}
          />

          {/* Reference Image Upload */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: `1px solid ${colors.mintMuted}`,
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colors.mint,
              marginBottom: '12px',
            }}>
              Reference Image (Optional)
            </div>
            {referenceImage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={`data:image/png;base64,${referenceImage}`}
                  alt="Reference"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                    border: `1px solid ${colors.mintMuted}`,
                    imageRendering: 'pixelated',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: colors.cream,
                    marginBottom: '8px',
                  }}>
                    {referenceImageName}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDescribeImage}
                      disabled={isDescribingImage || isTransitioning}
                    >
                      {isDescribingImage ? 'Describing...' : 'Describe Image'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearReferenceImage}
                      disabled={isDescribingImage || isTransitioning}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                border: `2px dashed ${colors.mintMuted}`,
                cursor: isTransitioning ? 'not-allowed' : 'var(--cursor-pointer)',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: colors.cream,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: isTransitioning ? 0.6 : 1,
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.borderColor = colors.mint;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.mintMuted;
              }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  disabled={isTransitioning}
                  style={{ display: 'none' }}
                />
                Click to upload reference
              </label>
            )}
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: colors.cream + '80',
              margin: '8px 0 0 0',
            }}>
              Upload an image and click Describe to auto-generate a description
            </p>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <span style={hintStyle}>
              Describe appearance, personality, and any distinctive features
            </span>
          </div>
        </div>

        {/* Button Row */}
        <div style={buttonRowStyle}>
          <button
            style={backButtonStyle}
            onClick={handleBack}
            disabled={isTransitioning}
            onMouseEnter={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor = `${colors.mint}15`;
                e.currentTarget.style.borderColor = colors.mint;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.mintMuted;
            }}
          >
            <span style={{ fontSize: '16px' }}>{'<'}</span>
            <span>Back</span>
          </button>

          <button
            style={ctaButtonStyle}
            onClick={handleNext}
            disabled={!isDescriptionValid || isTransitioning}
            onMouseEnter={(e) => {
              if (isDescriptionValid && !isTransitioning) {
                e.currentTarget.style.backgroundColor = '#ff6b6b';
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isDescriptionValid && !isTransitioning) {
                e.currentTarget.style.backgroundColor = colors.coral;
                e.currentTarget.style.borderColor = colors.coral;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span>Generate Identity</span>
            <span style={{ fontSize: '16px' }}>{'>'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DescribeStage;
