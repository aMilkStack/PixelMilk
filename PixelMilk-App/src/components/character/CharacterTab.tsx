import React, { useState, useEffect } from 'react';
import { DescriptionInput } from './DescriptionInput';
import { StyleSelector } from './StyleSelector';
import { IdentityCard } from './IdentityCard';
import { SpritePreview } from './SpritePreview';
import { GenerateControls } from './GenerateControls';
import { useCharacterStore } from '../../stores';
import { useAppStore } from '../../stores';
import { generateCharacterIdentity, generateSouthSpriteData } from '../../services/gemini';
import { saveAsset } from '../../services/storage';
import type { SpriteAsset, PixelData } from '../../types';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

const getIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export const CharacterTab: React.FC = () => {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(4);

  const { apiKey, openApiKeyModal } = useAppStore();

  const {
    description,
    styleParams,
    identity,
    sprites,
    isGeneratingIdentity,
    isGeneratingSprite,
    error,
    setDescription,
    setStyleParams,
    setIdentity,
    addSprite,
    setGeneratingIdentity,
    setGeneratingSprite,
    setError,
    clearCharacter,
  } = useCharacterStore();

  // Get the current sprite (South facing for now)
  const currentSprite: PixelData | null = sprites.length > 0 ? sprites[0].data : null;

  // Check if description is valid
  const isDescriptionValid = description.length >= 10 && description.length <= 2000;

  // Handle Generate Identity
  const handleGenerateIdentity = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!isDescriptionValid) {
      setError('Please enter a valid description (10-2000 characters)');
      return;
    }

    setError(null);
    setGeneratingIdentity(true);

    try {
      const newIdentity = await generateCharacterIdentity(apiKey, description, styleParams);
      setIdentity(newIdentity);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate identity';

      // Check for auth errors
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API key')) {
        openApiKeyModal();
        setError('Invalid API key. Please check your key and try again.');
      } else if (errorMessage.includes('429')) {
        setError('Rate limited. Please wait a moment and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setGeneratingIdentity(false);
    }
  };

  // Handle Generate Sprite
  const handleGenerateSprite = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!identity) {
      setError('Please generate an identity first');
      return;
    }

    setError(null);
    setGeneratingSprite(true);

    try {
      const pixelData = await generateSouthSpriteData(apiKey, identity);
      const sprite: SpriteAsset = {
        id: `sprite-${Date.now()}`,
        direction: 'S',
        data: pixelData,
        timestamp: Date.now(),
      };
      addSprite(sprite);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate sprite';

      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API key')) {
        openApiKeyModal();
        setError('Invalid API key. Please check your key and try again.');
      } else if (errorMessage.includes('429')) {
        setError('Rate limited. Please wait a moment and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setGeneratingSprite(false);
    }
  };

  // Handle Save to Library
  const handleSaveToLibrary = async () => {
    if (!identity || sprites.length === 0) {
      setError('Nothing to save. Generate identity and sprite first.');
      return;
    }

    try {
      await saveAsset({
        id: `character-${Date.now()}`,
        type: 'character',
        name: identity.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: identity,
        sprites: sprites,
      });
      setError(null);
      // Could show a success message here
    } catch (err) {
      setError('Failed to save to library');
    }
  };

  // Handle Clear
  const handleClear = () => {
    clearCharacter();
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '24px',
    height: '100%',
    width: '100%',
  };

  const leftColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flex: isMobile ? 'none' : '1',
    minWidth: isMobile ? 'auto' : '300px',
    maxWidth: isMobile ? 'none' : '400px',
  };

  const rightColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flex: '1',
    minWidth: isMobile ? 'auto' : '300px',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}40`,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.cream,
    marginBottom: '12px',
  };

  return (
    <div style={containerStyle}>
      {/* Left Column - Input & Controls */}
      <div style={leftColumnStyle}>
        {/* Description Input */}
        <div style={sectionStyle}>
          <DescriptionInput
            value={description}
            onChange={setDescription}
            disabled={isGeneratingIdentity || isGeneratingSprite}
          />
        </div>

        {/* Style Selector */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Style Options</div>
          <StyleSelector
            value={styleParams}
            onChange={setStyleParams}
            disabled={isGeneratingIdentity || isGeneratingSprite}
          />
        </div>

        {/* Generate Controls */}
        <div style={sectionStyle}>
          <GenerateControls
            hasIdentity={identity !== null}
            hasSprite={sprites.length > 0}
            isGeneratingIdentity={isGeneratingIdentity}
            isGeneratingSprite={isGeneratingSprite}
            error={error}
            onGenerateIdentity={handleGenerateIdentity}
            onGenerateSprite={handleGenerateSprite}
            onSaveToLibrary={handleSaveToLibrary}
            onClear={handleClear}
            disabled={!isDescriptionValid}
          />
        </div>
      </div>

      {/* Right Column - Preview & Identity */}
      <div style={rightColumnStyle}>
        {/* Sprite Preview */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Sprite Preview</div>
          <SpritePreview
            pixelData={currentSprite}
            isLoading={isGeneratingSprite}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </div>

        {/* Identity Card */}
        <IdentityCard
          identity={identity}
          isLoading={isGeneratingIdentity}
        />
      </div>
    </div>
  );
};

export default CharacterTab;
