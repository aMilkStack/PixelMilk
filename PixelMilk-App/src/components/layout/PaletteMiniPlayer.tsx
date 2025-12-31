/**
 * PaletteMiniPlayer - Compact Spotify-style floating widget for palette selection
 *
 * Collapsed: Tiny square widget (draggable)
 * Expanded: Full-screen music player with descriptions
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PxPlay, PxPause, PxPrev, PxNext, PxShuffle,
  PxVolume, PxVolumeX, PxChevronUp, PxChevronDown, PxMusic, PxClose, PxScale, PxScaleDown, PxDrag
} from '../shared/PixelIcon';
import { useCharacterStore } from '../../stores';
import {
  PALETTES,
  type ExtendedPalette,
  type PaletteCategory,
} from '../../data/palettes';
import soundtrackData from '../../data/soundtrack.json';
import paletteDescriptions from '../../data/paletteDescriptions.json';

// Terminal aesthetic colors
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  bgTertiary: '#153535',
  mint: '#8bd0ba',
  mintDim: '#5a9a88',
  mintFaint: '#4a7a6e',
  cream: '#d8c8b8',
};

// Types
interface SoundtrackEntry {
  audioPrompt: string;
  bpm: number;
  energy: 'low' | 'medium' | 'high';
}

interface DescriptionEntry {
  description: string;
  keywords: string[];
}

const soundtrack = soundtrackData as Record<string, SoundtrackEntry>;
const descriptions = paletteDescriptions as Record<string, DescriptionEntry>;

// Known audio files
const AVAILABLE_AUDIO = new Set([
  'cultoftheeighties',
  'midflight',
  'outerspasing',
]);

function getAudioUrl(paletteId: string): string | null {
  return AVAILABLE_AUDIO.has(paletteId) ? `/audio/${paletteId}.wav` : null;
}

// Build track list
interface Track extends ExtendedPalette {
  hasAudio: boolean;
  bpm?: number;
  description?: string;
  keywords?: string[];
}

const ALL_TRACKS: Track[] = PALETTES.map(p => ({
  ...p,
  hasAudio: AVAILABLE_AUDIO.has(p.id),
  bpm: soundtrack[p.id]?.bpm,
  description: descriptions[p.id]?.description,
  keywords: descriptions[p.id]?.keywords,
}));

// Mini player size (35% bigger than original 72px)
const MINI_SIZE = 96;

export const PaletteMiniPlayer: React.FC = () => {
  const { styleParams, setStyleParams } = useCharacterStore();

  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory | 'all'>('all');
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(32).fill(20));
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Internal track ID - decoupled from styleParams so shuffle works
  const [internalTrackId, setInternalTrackId] = useState<string | null>(null);

  // Drag state
  const [position, setPosition] = useState({ x: 16, y: 16 }); // bottom-right offset
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get filtered tracks
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return ALL_TRACKS;
    return ALL_TRACKS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  // Current track from internal state (decoupled from styleParams for shuffle)
  const currentTrack = useMemo(() => {
    if (!internalTrackId) return null;
    return ALL_TRACKS.find(t => t.id === internalTrackId) || null;
  }, [internalTrackId]);

  // Current index in filtered list
  const currentIndex = useMemo(() => {
    if (!currentTrack) return -1;
    return filteredTracks.findIndex(t => t.id === currentTrack.id);
  }, [currentTrack, filteredTracks]);

  // Active colors for visualizer
  const activeColors = currentTrack?.colors || [colors.mint];

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.7;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !audioLoaded) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioLoaded]);

  // Waveform animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveHeights(Array(32).fill(0).map(() => 10 + Math.random() * 80));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = dragRef.current.startX - e.clientX;
      const dy = dragRef.current.startY - e.clientY;
      const newX = Math.max(8, Math.min(window.innerWidth - MINI_SIZE - 8, dragRef.current.startPosX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - MINI_SIZE - 8, dragRef.current.startPosY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Load audio for track
  const loadAudio = useCallback((track: Track) => {
    if (!audioRef.current) return;
    const url = getAudioUrl(track.id);
    if (url) {
      setAudioLoaded(false);
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.oncanplaythrough = () => setAudioLoaded(true);
    } else {
      setAudioLoaded(false);
      audioRef.current.src = '';
    }
  }, []);

  // Select a track
  const selectTrack = useCallback((track: Track) => {
    setInternalTrackId(track.id);
    setStyleParams({ paletteMode: track.id });
    loadAudio(track);
    setIsPlaying(true);
  }, [setStyleParams, loadAudio]);

  // Next/Prev
  const nextTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;
    let nextIdx = shuffleMode
      ? Math.floor(Math.random() * filteredTracks.length)
      : (currentIndex + 1) % filteredTracks.length;
    selectTrack(filteredTracks[nextIdx]);
  }, [filteredTracks, currentIndex, shuffleMode, selectTrack]);

  const prevTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    selectTrack(filteredTracks[prevIdx]);
  }, [filteredTracks, currentIndex, selectTrack]);

  // Toggle play
  const togglePlay = useCallback(() => {
    if (currentTrack) {
      if (!audioLoaded && currentTrack.hasAudio) {
        loadAudio(currentTrack);
      }
      setIsPlaying(!isPlaying);
    }
  }, [currentTrack, isPlaying, audioLoaded, loadAudio]);

  // ============================================
  // MINI PLAYER (Collapsed State) - Compact Square
  // ============================================
  if (!isExpanded) {
    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => { setShowTooltip(true); setIsHovering(true); }}
        onMouseLeave={() => { setShowTooltip(false); setIsHovering(false); }}
        style={{
          position: 'fixed',
          bottom: position.y,
          right: position.x,
          zIndex: 1000,
          width: MINI_SIZE,
          height: MINI_SIZE,
          background: colors.bgPrimary,
          border: `1px solid ${colors.mintFaint}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Palette colour bars as background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          opacity: 0.4,
        }}>
          {(currentTrack ? activeColors.slice(0, 6) : [colors.mintFaint]).map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>

        {/* Waveform overlay when playing */}
        {isPlaying && currentTrack && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '1px',
            padding: '0 6px',
          }}>
            {waveHeights.slice(0, 16).map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * 0.2}px`,
                  backgroundColor: activeColors[i % activeColors.length],
                  transition: 'height 0.1s ease-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Central play/pause button */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentTrack) {
                togglePlay();
              } else {
                setIsExpanded(true);
              }
            }}
            style={{
              width: 44,
              height: 44,
              background: `${colors.bgPrimary}cc`,
              border: `1px solid ${colors.mint}`,
              color: colors.mint,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {currentTrack ? (
              isPlaying ? <PxPause size={18} /> : <PxPlay size={18} />
            ) : (
              <PxMusic size={18} />
            )}
          </button>
        </div>

        {/* Corner controls */}
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          display: 'flex',
          gap: 2,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            style={{
              width: 22,
              height: 22,
              background: `${colors.bgPrimary}cc`,
              border: 'none',
              color: colors.mint,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Browse palettes"
          >
            <PxScale size={12} />
          </button>
        </div>

        {/* Skip controls - bottom corners */}
        {currentTrack && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevTrack(); }}
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                width: 22,
                height: 22,
                background: `${colors.bgPrimary}aa`,
                border: 'none',
                color: colors.mint,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              <PxPrev size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 22,
                height: 22,
                background: `${colors.bgPrimary}aa`,
                border: 'none',
                color: colors.mint,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              <PxNext size={12} />
            </button>
          </>
        )}

        {/* Tooltip on hover */}
        {showTooltip && !isDragging && (
          <div style={{
            position: 'absolute',
            bottom: MINI_SIZE + 8,
            right: 0,
            background: colors.bgSecondary,
            border: `1px solid ${colors.mintFaint}`,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: colors.cream,
            }}>
              {currentTrack ? currentTrack.name : 'Select a palette'}
            </div>
            {currentTrack && (
              <div style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                color: colors.mintDim,
                marginTop: 2,
              }}>
                {currentTrack.colourCount} colours
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // FULL PLAYER (Expanded State)
  // ============================================
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: `1px solid ${colors.mintFaint}`,
        background: colors.bgSecondary,
      }}>
        <div style={{
          fontFamily: 'FaytePixel, monospace',
          fontSize: '32px',
          color: colors.cream,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <PxMusic size={24} style={{ color: colors.mint }} />
          Palette Playlist
          <span style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: colors.mintDim,
          }}>
            {ALL_TRACKS.length} palettes
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'transparent',
            border: `1px solid ${colors.mintFaint}`,
            color: colors.mint,
            cursor: 'pointer',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <PxScaleDown size={14} />
          Minimize
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        overflow: 'hidden',
      }}>
        {/* Left: Track List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: `1px solid ${colors.mintFaint}`,
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.mintFaint}`,
            background: colors.bgSecondary,
            padding: '0 16px',
          }}>
            {(['all', 'Micro', 'Limited', 'Extended', 'Full'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '12px 20px',
                  background: selectedCategory === cat ? colors.bgTertiary : 'transparent',
                  border: 'none',
                  borderBottom: selectedCategory === cat ? `2px solid ${colors.mint}` : '2px solid transparent',
                  color: selectedCategory === cat ? colors.mint : colors.mintDim,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {cat === 'all' ? `All (${ALL_TRACKS.length})` : cat}
              </button>
            ))}
          </div>

          {/* Track list header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 120px 80px',
            padding: '10px 24px',
            borderBottom: `1px solid ${colors.mintFaint}`,
            fontFamily: 'monospace',
            fontSize: '10px',
            color: colors.mintFaint,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: colors.bgSecondary,
          }}>
            <span>#</span>
            <span>Palette</span>
            <span>Colours</span>
            <span>BPM</span>
          </div>

          {/* Scrollable track list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {filteredTracks.map((track, idx) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 120px 80px',
                    width: '100%',
                    padding: '12px 24px',
                    background: isActive ? `${colors.mint}15` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: isActive ? colors.mint : colors.mintFaint,
                  }}>
                    {isActive && isPlaying ? <PxPlay size={12} /> : String(idx + 1).padStart(2, '0')}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Color preview */}
                    <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
                      {track.colors.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ width: '12px', height: '12px', backgroundColor: c }} />
                      ))}
                    </div>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: isActive ? colors.cream : colors.mint,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      {track.name}
                      {track.hasAudio && <PxVolume size={10} style={{ opacity: 0.5 }} />}
                    </span>
                  </div>

                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: colors.mintDim,
                  }}>
                    {track.colourCount} colours
                  </span>

                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: colors.mintFaint,
                  }}>
                    {track.bpm || '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Now Playing Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: colors.bgSecondary,
          padding: '24px',
        }}>
          {currentTrack ? (
            <>
              {/* Large album art */}
              <div style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                border: `2px solid ${colors.mintFaint}`,
                marginBottom: '20px',
              }}>
                {activeColors.map((c, i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </div>

              {/* Track name */}
              <div style={{
                fontFamily: 'FaytePixel, monospace',
                fontSize: '36px',
                color: colors.cream,
                marginBottom: '4px',
              }}>
                {currentTrack.name}
              </div>

              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: colors.mintDim,
                marginBottom: '16px',
              }}>
                {currentTrack.colourCount} colours · {currentTrack.category}
                {currentTrack.bpm && ` · ${currentTrack.bpm} BPM`}
              </div>

              {/* Keywords */}
              {currentTrack.keywords && currentTrack.keywords.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '16px',
                }}>
                  {currentTrack.keywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: colors.bgTertiary,
                        border: `1px solid ${colors.mintFaint}`,
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: colors.mint,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {currentTrack.description && (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: colors.cream,
                  opacity: 0.8,
                  marginBottom: '20px',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}>
                  {currentTrack.description}
                </div>
              )}

              {/* Waveform */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3px',
                height: '60px',
                marginBottom: '20px',
              }}>
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${isPlaying ? h : 15}%`,
                      backgroundColor: activeColors[i % activeColors.length],
                      transition: 'height 0.12s ease-out',
                    }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
              }}>
                <button
                  onClick={() => setShuffleMode(!shuffleMode)}
                  style={{
                    ...iconBtnStyleLarge,
                    background: shuffleMode ? colors.bgTertiary : 'transparent',
                    borderColor: shuffleMode ? colors.mint : colors.mintFaint,
                  }}
                  title="Shuffle"
                >
                  <PxShuffle size={16} />
                </button>
                <button onClick={prevTrack} style={iconBtnStyleLarge}>
                  <PxPrev size={18} />
                </button>
                <button onClick={togglePlay} style={playBtnStyleLarge}>
                  {isPlaying ? <PxPause size={24} /> : <PxPlay size={24} />}
                </button>
                <button onClick={nextTrack} style={iconBtnStyleLarge}>
                  <PxNext size={18} />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    ...iconBtnStyleLarge,
                    background: isMuted ? colors.bgTertiary : 'transparent',
                    borderColor: isMuted ? colors.mint : colors.mintFaint,
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <PxVolumeX size={16} /> : <PxVolume size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.mintDim,
              textAlign: 'center',
            }}>
              <PxMusic size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                Select a palette to preview
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Button styles
const iconBtnStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  background: 'transparent',
  border: `1px solid ${colors.mintFaint}`,
  color: colors.mint,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const playBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  background: colors.mint,
  border: 'none',
  color: colors.bgPrimary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconBtnStyleLarge: React.CSSProperties = {
  width: '44px',
  height: '44px',
  background: 'transparent',
  border: `1px solid ${colors.mintFaint}`,
  color: colors.mint,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const playBtnStyleLarge: React.CSSProperties = {
  width: '64px',
  height: '64px',
  background: colors.mint,
  border: 'none',
  color: colors.bgPrimary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default PaletteMiniPlayer;
