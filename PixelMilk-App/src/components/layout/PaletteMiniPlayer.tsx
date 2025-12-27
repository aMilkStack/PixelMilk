/**
 * PaletteMiniPlayer - Floating Spotify-style music player for palette selection
 *
 * Collapsed: Mini widget bottom-right
 * Expanded: Full-screen music player with descriptions
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle,
  Volume2, VolumeX, ChevronUp, ChevronDown, Music, X, Maximize2, Minimize2
} from 'lucide-react';
import { useCharacterStore } from '../../stores';
import {
  LOSPEC_PALETTES,
  type ExtendedPalette,
  type PaletteCategory,
} from '../../data/lospecPalettes';
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

const ALL_TRACKS: Track[] = LOSPEC_PALETTES.map(p => ({
  ...p,
  hasAudio: AVAILABLE_AUDIO.has(p.id),
  bpm: soundtrack[p.id]?.bpm,
  description: descriptions[p.id]?.description,
  keywords: descriptions[p.id]?.keywords,
}));

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

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get filtered tracks
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return ALL_TRACKS;
    return ALL_TRACKS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  // Current track from styleParams
  const currentTrack = useMemo(() => {
    const id = styleParams.paletteMode;
    if (!id || id === 'auto') return null;
    return ALL_TRACKS.find(t => t.id === id) || null;
  }, [styleParams.paletteMode]);

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
  // MINI PLAYER (Collapsed State)
  // ============================================
  if (!isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: colors.bgPrimary,
        border: `1px solid ${colors.mintFaint}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        width: '320px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.mintFaint}`,
          background: colors.bgSecondary,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'monospace',
            fontSize: '10px',
            color: colors.mintDim,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <Music size={10} />
            Palette Player
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.mint,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Current Track */}
        <div style={{ padding: '10px 12px' }}>
          {currentTrack ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Mini album art */}
              <div style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.mintFaint}`,
                flexShrink: 0,
              }}>
                {activeColors.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  color: colors.cream,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {currentTrack.name}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: colors.mintDim,
                  marginTop: '2px',
                }}>
                  {currentTrack.colourCount} colours · {currentTrack.category}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button onClick={prevTrack} style={iconBtnStyle}><SkipBack size={12} /></button>
                <button onClick={togglePlay} style={playBtnStyle}>
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={nextTrack} style={iconBtnStyle}><SkipForward size={12} /></button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: colors.mintDim,
              padding: '8px',
            }}>
              Click <Maximize2 size={10} style={{ verticalAlign: 'middle' }} /> to browse palettes
            </div>
          )}
        </div>

        {/* Mini waveform */}
        {currentTrack && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '20px',
            padding: '0 12px 8px',
          }}>
            {waveHeights.slice(0, 16).map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${isPlaying ? h : 20}%`,
                  backgroundColor: activeColors[i % activeColors.length],
                  transition: 'height 0.12s ease-out',
                }}
              />
            ))}
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
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: colors.cream,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Music size={20} style={{ color: colors.mint }} />
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
          <Minimize2 size={14} />
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
                    {isActive && isPlaying ? '▶' : String(idx + 1).padStart(2, '0')}
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
                      {track.hasAudio && <Volume2 size={10} style={{ opacity: 0.5 }} />}
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
                fontFamily: 'Georgia, serif',
                fontSize: '24px',
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
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
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
                  <Shuffle size={16} />
                </button>
                <button onClick={prevTrack} style={iconBtnStyleLarge}>
                  <SkipBack size={18} />
                </button>
                <button onClick={togglePlay} style={playBtnStyleLarge}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={nextTrack} style={iconBtnStyleLarge}>
                  <SkipForward size={18} />
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
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
              <Music size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
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
