import React from 'react';
import { AppShell } from './components/layout';
import { Panel } from './components/shared';
import { CharacterTab } from './components/character';
import { useAppStore } from './stores';
import { TabId } from './types';
import { User, Grid3X3, Box, Layers, Combine, Library } from 'lucide-react';

// Placeholder content for each tab
const TabPlaceholder: React.FC<{ tabId: TabId }> = ({ tabId }) => {
  const icons: Record<TabId, React.ReactNode> = {
    character: <User size={48} />,
    tile: <Grid3X3 size={48} />,
    object: <Box size={48} />,
    texture: <Layers size={48} />,
    compose: <Combine size={48} />,
    library: <Library size={48} />,
  };

  const descriptions: Record<TabId, string> = {
    character: 'Create AI-powered pixel art characters with multi-angle sprite generation.',
    tile: 'Generate seamless tileable textures and patterns for game environments.',
    object: 'Design props, items, and environmental objects for your pixel art games.',
    texture: 'Create detailed surface textures and material patterns.',
    compose: 'Combine and arrange your assets into complete scenes.',
    library: 'Browse and manage all your saved pixel art assets.',
  };

  return (
    <Panel title={tabId.charAt(0).toUpperCase() + tabId.slice(1)}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          minHeight: '300px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-lg)', opacity: 0.5 }}>
          {icons[tabId]}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-md)',
            textTransform: 'uppercase',
          }}
        >
          {tabId} Generator
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-sm)',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          {descriptions[tabId]}
        </p>
        <div
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-sm) var(--space-md)',
            border: '1px dashed var(--color-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          [Coming in Phase 2]
        </div>
      </div>
    </Panel>
  );
};

export default function App() {
  const { activeTab } = useAppStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'character':
        return <CharacterTab />;
      default:
        return <TabPlaceholder tabId={activeTab} />;
    }
  };

  return (
    <AppShell>
      {renderTabContent()}
    </AppShell>
  );
}
