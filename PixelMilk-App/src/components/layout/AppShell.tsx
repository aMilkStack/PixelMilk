import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { TabBar } from './TabBar';
import { ApiKeyModal } from './ApiKeyModal';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '../shared';
import { useAppStore } from '../../stores';
import { getApiKey } from '../../services/storage';

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
  const { apiKey, setApiKey, openApiKeyModal, isApiKeyModalOpen } = useAppStore();
  const isMobile = useIsMobile();

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
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
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
      overflow: 'auto',
    },
  };

  useEffect(() => {
    // Check for stored API key on mount
    const checkApiKey = async () => {
      const storedKey = await getApiKey();
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        // Open modal if no API key is stored
        openApiKeyModal();
      }
    };
    checkApiKey();
  }, [setApiKey, openApiKeyModal]);

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
            {apiKey && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={styles.statusDot} />
                <span style={styles.statusText}>API Connected</span>
              </div>
            )}
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
      </div>
    </ErrorBoundary>
  );
};
