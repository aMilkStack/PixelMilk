import React, { useState, useEffect } from 'react';
import { Key, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Button, Input } from '../shared';
import { useAppStore } from '../../stores';
import { initializeClient } from '../../services/gemini';
import { getApiKey, setApiKey as saveApiKey } from '../../services/storage';

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

/**
 * Validates API key format before making network requests.
 * Gemini API keys typically start with "AIza" and are ~39 characters.
 * Returns null if valid, or an error message if invalid.
 */
const validateApiKeyFormat = (key: string): string | null => {
  const trimmed = key.trim();

  if (!trimmed) {
    return 'API key is required';
  }

  if (trimmed.length < 30) {
    return 'API key is too short. Gemini keys are typically ~39 characters.';
  }

  if (trimmed.length > 50) {
    return 'API key is too long. Please check for extra characters.';
  }

  if (!trimmed.startsWith('AI')) {
    return 'Invalid key format. Gemini API keys typically start with "AI".';
  }

  return null; // Format is valid
};

const getIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const baseStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 26, 26, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-md)',
  },
  modal: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--font-size-xl)',
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 'var(--space-md)',
    right: 'var(--space-md)',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'var(--cursor-pointer)',
    padding: 'var(--space-xs)',
  },
  description: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-md)',
    lineHeight: 1.5,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
  },
  statusValid: {
    color: 'var(--color-success)',
  },
  statusInvalid: {
    color: 'var(--color-error)',
  },
  buttonRow: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-lg)',
  },
  link: {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
  },
};

export const ApiKeyModal: React.FC = () => {
  const { isApiKeyModalOpen, closeApiKeyModal, setApiKey } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const isMobile = useIsMobile();

  const styles: Record<string, React.CSSProperties> = {
    ...baseStyles,
    modal: {
      ...baseStyles.modal,
      padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
      maxWidth: isMobile ? '320px' : '420px',
    },
    title: {
      ...baseStyles.title,
      fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-xl)',
    },
    description: {
      ...baseStyles.description,
      fontSize: isMobile ? '12px' : 'var(--font-size-sm)',
    },
  };

  useEffect(() => {
    // Track mounted state to prevent setting state on unmounted component
    // This fixes race condition when modal rapidly opens/closes (Bug M4)
    let isMounted = true;

    if (isApiKeyModalOpen) {
      // Load existing key if any
      getApiKey().then((key) => {
        // Only update state if component is still mounted
        if (isMounted && key) {
          setInputValue(key);
        }
      });
    }

    // Cleanup function to mark component as unmounted
    return () => {
      isMounted = false;
    };
  }, [isApiKeyModalOpen]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      // Validate using SDK - key is sent securely in request body, not URL
      const testClient = new GoogleGenAI({ apiKey: key });
      // Use a lightweight call to verify the key works
      await testClient.models.list();
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const trimmedKey = inputValue.trim();

    // First, validate format before making expensive network call (Bug M12)
    const formatError = validateApiKeyFormat(trimmedKey);
    if (formatError) {
      setErrorMessage(formatError);
      setValidationStatus('invalid');
      return;
    }

    setValidationStatus('validating');
    setErrorMessage('');

    const isValid = await validateApiKey(trimmedKey);

    if (isValid) {
      // Try to save the key first - don't close modal if save fails
      try {
        await saveApiKey(trimmedKey);
      } catch (saveError) {
        setValidationStatus('invalid');
        setErrorMessage('Failed to save API key. Please try again.');
        return;
      }

      setValidationStatus('valid');
      initializeClient(trimmedKey);
      setApiKey(trimmedKey);

      // Close modal after short delay to show success
      setTimeout(() => {
        closeApiKeyModal();
        setValidationStatus('idle');
      }, 800);
    } else {
      setValidationStatus('invalid');
      setErrorMessage('Invalid API key. Please check and try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationStatus !== 'validating') {
      handleSubmit();
    }
  };

  if (!isApiKeyModalOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button
          style={styles.closeButton}
          onClick={closeApiKeyModal}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={styles.header}>
          <Key size={24} color="var(--color-accent)" />
          <h2 style={styles.title}>API Configuration</h2>
        </div>

        <p style={styles.description}>
          Enter your Google Gemini API key to enable AI-powered pixel art generation.
          Get your key from{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Google AI Studio
          </a>
          .
        </p>

        <Input
          label="Gemini API Key"
          type="password"
          placeholder="AIza..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationStatus('idle');
            setErrorMessage('');
          }}
          onKeyDown={handleKeyDown}
          error={errorMessage}
          disabled={validationStatus === 'validating'}
        />

        {validationStatus === 'validating' && (
          <div style={styles.statusRow}>
            <Loader size={16} className="spin" />
            <span>Validating API key...</span>
          </div>
        )}

        {validationStatus === 'valid' && (
          <div style={{ ...styles.statusRow, ...styles.statusValid }}>
            <CheckCircle size={16} />
            <span>API key validated successfully!</span>
          </div>
        )}

        {validationStatus === 'invalid' && (
          <div style={{ ...styles.statusRow, ...styles.statusInvalid }}>
            <AlertCircle size={16} />
            <span>Validation failed</span>
          </div>
        )}

        <div style={styles.buttonRow}>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={validationStatus === 'validating' || !inputValue.trim()}
          >
            {validationStatus === 'validating' ? 'Validating...' : 'Save Key'}
          </Button>
          <Button variant="ghost" onClick={closeApiKeyModal}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
