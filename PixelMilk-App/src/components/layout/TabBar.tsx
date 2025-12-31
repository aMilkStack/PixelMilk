import React, { useState, useEffect } from 'react';
import { PxUser, PxAddGrid, PxArchive, PxLayout, PxGroup, PxBook } from '../shared/PixelIcon';
import { TabId, TabConfig } from '../../types';
import { useAppStore } from '../../stores';

const tabs: TabConfig[] = [
  { id: 'character', label: 'Character', icon: 'User' },
  { id: 'tile', label: 'Tile', icon: 'Grid3X3' },
  { id: 'object', label: 'Object', icon: 'Box' },
  { id: 'texture', label: 'Texture', icon: 'Layers' },
  { id: 'compose', label: 'Compose', icon: 'Combine' },
  { id: 'library', label: 'Library', icon: 'Library' },
];

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  User: PxUser,
  Grid3X3: PxAddGrid,
  Box: PxArchive,
  Layers: PxLayout,
  Combine: PxGroup,
  Library: PxBook,
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

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null);
  const isMobile = useIsMobile();

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      gap: '0',
      backgroundColor: 'var(--color-bg-primary)',
      borderBottom: '1px solid var(--color-border)',
      overflowX: 'auto',
      overflowY: 'hidden',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    },
    tab: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '0' : 'var(--space-sm)',
      padding: isMobile ? 'var(--space-sm) var(--space-md)' : 'var(--space-sm) var(--space-md)',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      color: 'var(--color-text-secondary)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-base)',
      cursor: 'var(--cursor-pointer)',
      transition: 'all 0.15s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      minWidth: isMobile ? '48px' : 'auto',
    },
    tabActive: {
      color: 'var(--color-text-primary)',
      borderBottomColor: 'var(--color-accent-red)',
      backgroundColor: 'var(--color-bg-secondary)',
    },
    tabHover: {
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-tertiary)',
    },
    label: {
      display: isMobile ? 'none' : 'inline',
    },
  };

  return (
    <nav style={styles.container}>
      {tabs.map((tab) => {
        const Icon = iconMap[tab.icon];
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id && !isActive;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
              ...(isHovered ? styles.tabHover : {}),
            }}
            title={tab.label}
            aria-label={tab.label}
          >
            {Icon && <Icon size={isMobile ? 20 : 16} />}
            <span style={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
