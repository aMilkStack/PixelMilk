import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { TabBar } from './TabBar';
import { ApiKeyModal } from './ApiKeyModal';
import { ErrorBoundary } from './ErrorBoundary';
import { PaletteMiniPlayer } from './PaletteMiniPlayer';
import { Button } from '../shared';
import { useAppStore, useCanvasStore } from '../../stores';
import { initializeClient, validateApiKey } from '../../services/gemini';
import { getApiKey, clearApiKey } from '../../services/storage';

interface AppShellProps {
  children: React.ReactNode;
}

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

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { apiKey, setApiKey, setError, openApiKeyModal, isApiKeyModalOpen, apiKeyStatus, setApiKeyStatus } = useAppStore();
  const { loadPersistedState: loadCanvasState } = useCanvasStore();
  const isMobile = useIsMobile();
  const [isValidating, setIsValidating] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? 'var(--space-xs) var(--space-md)' : 'var(--space-xs) var(--space-lg)',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-bg-secondary)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: 'var(--color-success)',
      marginRight: 'var(--space-xs)',
    },
    statusText: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)',
      display: isMobile ? 'none' : 'inline',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    content: {
      flex: 1,
      padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
      overflow: 'auto',
    },
  };

  // Load persisted canvas state on mount (Bug M7 fix)
  useEffect(() => {
    loadCanvasState();
  }, [loadCanvasState]);

  useEffect(() => {
    // Check for stored API key on mount with proper error handling (Bug C2)
    // and validate the key before using it (Bug C5)
    const initializeApiKey = async () => {
      setIsValidating(true);
      setApiKeyStatus('unknown');

      try {
        const storedKey = await getApiKey();

        if (!storedKey) {
          // No API key stored - open modal
          setApiKeyStatus('unknown');
          openApiKeyModal();
          return;
        }

        // Validate the stored key before using it (Bug C5)
        const isValid = await validateApiKey(storedKey);

        if (isValid) {
          setApiKey(storedKey);
          initializeClient(storedKey);
          setApiKeyStatus('valid');
        } else {
          // Key is invalid - clear it and prompt for new one
          setApiKeyStatus('invalid');
          setError('Stored API key is no longer valid. Please enter a new key.');
          await clearApiKey().catch(console.error);
          setApiKey(null);
          openApiKeyModal();
        }
      } catch (error) {
        // Storage access failed (Bug C2)
        console.error('Failed to initialize API key:', error);
        setApiKeyStatus('error');
        setError('Failed to access storage. Please check browser permissions and try again.');
        openApiKeyModal();
      } finally {
        setIsValidating(false);
      }
    };

    initializeApiKey();
  }, [setApiKey, setError, openApiKeyModal, setApiKeyStatus]);

  return (
    <ErrorBoundary>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>
            <img
              src="/logo.svg"
              alt="PixelMilk"
              style={{
                height: isMobile ? '48px' : '64px',
                width: 'auto'
              }}
            />
          </div>

          <div style={styles.headerActions}>
            {isValidating ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  ...styles.statusDot,
                  backgroundColor: 'var(--color-warning)',
                  animation: 'pulse 1s infinite',
                }} />
                <span style={styles.statusText}>Validating...</span>
              </div>
            ) : apiKey && apiKeyStatus === 'valid' ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={styles.statusDot} />
                <span style={styles.statusText}>API Connected</span>
              </div>
            ) : apiKeyStatus === 'invalid' ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  ...styles.statusDot,
                  backgroundColor: 'var(--color-error)',
                }} />
                <span style={styles.statusText}>Invalid Key</span>
              </div>
            ) : apiKeyStatus === 'error' ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  ...styles.statusDot,
                  backgroundColor: 'var(--color-error)',
                }} />
                <span style={styles.statusText}>Storage Error</span>
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={openApiKeyModal}
              aria-label="Settings"
            >
              <Settings size={isMobile ? 20 : 18} />
            </Button>
          </div>
        </header>

        <main style={styles.main}>
          <TabBar />
          <div style={styles.content}>
            {children}
          </div>
        </main>

        {isApiKeyModalOpen && <ApiKeyModal />}

        {/* Floating palette mini-player */}
        <PaletteMiniPlayer />
      </div>
    </ErrorBoundary>
  );
};
