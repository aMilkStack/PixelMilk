/**
 * PalettePlaylist - Music player UI for palette selection
 *
 * Treats palettes like songs/tracks with:
 * - Categories as playlists (Micro, Limited, Extended, Full)
 * - Animated waveform visualizer using palette colors
 * - Audio playback (30s loops via ElevenLabs when available)
 * - Full music player controls (play/pause, prev/next, shuffle)
 * - Album art showing color stripes
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Volume2, VolumeX, X, Music, ChevronDown, ChevronUp } from 'lucide-react';
import {
  LOSPEC_PALETTES,
  type ExtendedPalette,
  type PaletteCategory,
} from '../../data/lospecPalettes';
import soundtrackData from '../../data/soundtrack.json';

// Terminal aesthetic colors
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  bgTertiary: '#153535',
  mint: '#8bd0ba',
  mintDim: '#5a9a88',
  mintFaint: '#4a7a6e',
  cream: '#d8c8b8',
  danger: '#f04e4e',
};

// Category display names
const CATEGORY_DISPLAY: Record<PaletteCategory, string> = {
  Micro: 'Micro (2-7)',
  Limited: 'Limited (8-15)',
  Extended: 'Extended (16-28)',
  Full: 'Full (32-256)',
};

// Soundtrack entry type
interface SoundtrackEntry {
  colours: number;
  audioPrompt: string;
  playlist: string;
  bpm: number;
  coverScene: string;
  energy: 'low' | 'medium' | 'high';
  tags: string[];
}

// Cast soundtrack data
const soundtrack = soundtrackData as Record<string, SoundtrackEntry>;

// Get soundtrack info for a palette
function getSoundtrackInfo(paletteId: string): SoundtrackEntry | null {
  return soundtrack[paletteId] || null;
}

// Build palette list with soundtrack info
interface PlaylistTrack extends ExtendedPalette {
  audioPrompt?: string;
  bpm?: number;
  energy?: 'low' | 'medium' | 'high';
  coverScene?: string;
  thematicPlaylist?: string;
  hasAudio?: boolean;
}

// Known audio files (add more as you generate them)
const AVAILABLE_AUDIO = new Set([
  'cultoftheeighties',
  'midflight',
  'outerspasing',
]);

function buildPlaylistTracks(): PlaylistTrack[] {
  return LOSPEC_PALETTES.map(palette => {
    const info = getSoundtrackInfo(palette.id);
    return {
      ...palette,
      audioPrompt: info?.audioPrompt,
      bpm: info?.bpm,
      energy: info?.energy,
      coverScene: info?.coverScene,
      thematicPlaylist: info?.playlist,
      hasAudio: AVAILABLE_AUDIO.has(palette.id),
    };
  });
}

/** Get audio URL for a palette (returns null if no audio available) */
function getAudioUrl(paletteId: string): string | null {
  if (AVAILABLE_AUDIO.has(paletteId)) {
    return `/audio/${paletteId}.wav`;
  }
  return null;
}

// All tracks
const ALL_TRACKS = buildPlaylistTracks();

// Group by category
const TRACKS_BY_CATEGORY = LOSPEC_PALETTES.reduce((acc, palette) => {
  if (!acc[palette.category]) acc[palette.category] = [];
  acc[palette.category].push(palette);
  return acc;
}, {} as Record<PaletteCategory, ExtendedPalette[]>);

// Props
export interface PalettePlaylistProps {
  /** Currently selected palette ID */
  selectedPaletteId: string | null;
  /** Callback when a palette is selected */
  onSelect: (paletteId: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Start in compact mode */
  defaultCompact?: boolean;
  /** Mute audio by default */
  defaultMuted?: boolean;
}

export const PalettePlaylist: React.FC<PalettePlaylistProps> = ({
  selectedPaletteId,
  onSelect,
  disabled = false,
  defaultCompact = true,
  defaultMuted = true,
}) => {
  // State
  const [isCompact, setIsCompact] = useState(defaultCompact);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory | 'all'>('all');
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(24).fill(20));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Audio ref for playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'none'; // Don't preload - load on demand
    audio.volume = 0.7;
    audioRef.current = audio;

    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !audioLoaded) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.warn('[PalettePlaylist] Audio play failed:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioLoaded]);

  // Get filtered tracks based on category
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return ALL_TRACKS;
    return ALL_TRACKS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  // Current track
  const currentTrack = useMemo(() => {
    if (currentTrackIndex >= 0 && currentTrackIndex < filteredTracks.length) {
      return filteredTracks[currentTrackIndex];
    }
    // If we have a selected palette, find it
    if (selectedPaletteId) {
      return ALL_TRACKS.find(t => t.id === selectedPaletteId) || null;
    }
    return null;
  }, [currentTrackIndex, filteredTracks, selectedPaletteId]);

  // Active colors for visualizer
  const activeColors = useMemo(() => {
    return currentTrack?.colors || [colors.mint];
  }, [currentTrack]);

  // Waveform animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveHeights(Array(24).fill(0).map(() => 15 + Math.random() * 70));
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Load audio for a track
  const loadAudio = useCallback((track: PlaylistTrack) => {
    if (!audioRef.current) return;

    const audioUrl = getAudioUrl(track.id);
    if (audioUrl) {
      setAudioLoaded(false);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.oncanplaythrough = () => {
        setAudioLoaded(true);
      };
    } else {
      // No audio for this track
      setAudioLoaded(false);
      audioRef.current.src = '';
    }
  }, []);

  // Play a track
  const playTrack = useCallback((track: PlaylistTrack) => {
    const index = filteredTracks.findIndex(t => t.id === track.id);
    setCurrentTrackIndex(index >= 0 ? index : 0);
    setIsPlaying(true);
    onSelect(track.id);

    // Load audio if available
    loadAudio(track);
  }, [filteredTracks, onSelect, loadAudio]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  }, [currentTrack, isPlaying]);

  // Next track
  const nextTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;

    let nextIndex: number;
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * filteredTracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % filteredTracks.length;
    }

    const track = filteredTracks[nextIndex];
    setCurrentTrackIndex(nextIndex);
    onSelect(track.id);
    loadAudio(track);
  }, [currentTrackIndex, filteredTracks, shuffleMode, onSelect, loadAudio]);

  // Previous track
  const prevTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;

    const prevIndex = (currentTrackIndex - 1 + filteredTracks.length) % filteredTracks.length;
    const track = filteredTracks[prevIndex];
    setCurrentTrackIndex(prevIndex);
    onSelect(track.id);
    loadAudio(track);
  }, [currentTrackIndex, filteredTracks, onSelect, loadAudio]);

  // Sync selected palette with current track
  useEffect(() => {
    if (selectedPaletteId && currentTrack?.id !== selectedPaletteId) {
      const index = filteredTracks.findIndex(t => t.id === selectedPaletteId);
      if (index >= 0) {
        setCurrentTrackIndex(index);
      }
    }
  }, [selectedPaletteId, currentTrack, filteredTracks]);

  // ============================================
  // COMPACT MODE - Inline player bar
  // ============================================
  if (isCompact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        background: colors.bgSecondary,
        border: `1px solid ${colors.mintFaint}`,
      }}>
        {/* Header with expand button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: colors.mintDim,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <Music size={12} />
            <span>Palette Playlist</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCompact(false)}
            disabled={disabled}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.mintFaint}`,
              color: colors.mint,
              fontFamily: 'monospace',
              fontSize: '10px',
              padding: '4px 8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ChevronDown size={12} />
            Expand
          </button>
        </div>

        {/* Current track display */}
        {currentTrack ? (
          <>
            {/* Album art (color stripes) + info */}
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}>
              {/* Mini album art */}
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.mintFaint}`,
                flexShrink: 0,
              }}>
                {activeColors.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </div>

              {/* Track info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
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

              {/* Compact controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <button
                  type="button"
                  onClick={prevTrack}
                  disabled={disabled}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: 'transparent',
                    border: `1px solid ${colors.mintFaint}`,
                    color: colors.mint,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBack size={14} />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={disabled}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: colors.mint,
                    border: 'none',
                    color: colors.bgPrimary,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  disabled={disabled}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: 'transparent',
                    border: `1px solid ${colors.mintFaint}`,
                    color: colors.mint,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForward size={14} />
                </button>
              </div>
            </div>

            {/* Mini waveform */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              height: '24px',
            }}>
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${isPlaying ? h : 20}%`,
                    backgroundColor: activeColors[i % activeColors.length],
                    transition: 'height 0.15s ease-out',
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: colors.mintDim,
          }}>
            Click expand to browse palettes
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // EXPANDED MODE - Full playlist view
  // ============================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: colors.bgPrimary,
      border: `1px solid ${colors.mintFaint}`,
      maxHeight: '500px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.mintFaint}`,
        background: colors.bgSecondary,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: colors.cream,
        }}>
          <span style={{ color: colors.mint }}>&gt;</span>
          PALETTE PLAYLIST
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: colors.mintDim,
          }}>
            {ALL_TRACKS.length} palettes
          </span>
          <button
            type="button"
            onClick={() => setIsCompact(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.mintFaint}`,
              color: colors.mint,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}
          >
            <ChevronUp size={12} />
            Compact
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 220px',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Track list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: '0',
            borderBottom: `1px solid ${colors.mintFaint}`,
            flexShrink: 0,
            flexWrap: 'wrap',
            background: colors.bgSecondary,
          }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 12px',
                background: selectedCategory === 'all' ? colors.bgTertiary : 'transparent',
                border: 'none',
                borderBottom: selectedCategory === 'all' ? `2px solid ${colors.mint}` : '2px solid transparent',
                color: selectedCategory === 'all' ? colors.mint : colors.mintDim,
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {(['Micro', 'Limited', 'Extended', 'Full'] as PaletteCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 12px',
                  background: selectedCategory === cat ? colors.bgTertiary : 'transparent',
                  border: 'none',
                  borderBottom: selectedCategory === cat ? `2px solid ${colors.mint}` : '2px solid transparent',
                  color: selectedCategory === cat ? colors.mint : colors.mintDim,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Track list header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr 100px 60px',
            padding: '8px 12px',
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
          <div style={{
            flex: 1,
            overflow: 'auto',
          }}>
            {filteredTracks.map((track, idx) => {
              const isActive = currentTrack?.id === track.id;
              const trackInfo = getSoundtrackInfo(track.id);

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrack(track)}
                  disabled={disabled}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 100px 60px',
                    width: '100%',
                    padding: '10px 12px',
                    background: isActive ? `${colors.mint}15` : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${colors.mintFaint}30`,
                    color: colors.mint,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isActive) {
                      e.currentTarget.style.background = colors.bgTertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ color: colors.mintFaint }}>
                    {isActive && isPlaying ? '>' : String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    color: isActive ? colors.cream : colors.mint,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {track.name}
                    {track.hasAudio && (
                      <Volume2 size={10} style={{ color: colors.mintDim, opacity: 0.7 }} />
                    )}
                  </span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}>
                    {track.colors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: c,
                        }}
                      />
                    ))}
                    {track.colors.length > 5 && (
                      <span style={{ fontSize: '10px', color: colors.mintFaint, marginLeft: '2px' }}>
                        +{track.colors.length - 5}
                      </span>
                    )}
                  </span>
                  <span style={{ color: colors.mintDim, fontSize: '11px' }}>
                    {trackInfo?.bpm || '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Now Playing sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          background: colors.bgSecondary,
          borderLeft: `1px solid ${colors.mintFaint}`,
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: colors.mintDim,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px',
          }}>
            <span style={{ color: colors.mint }}>&gt;</span> Now Playing
          </div>

          {currentTrack ? (
            <>
              {/* Album art */}
              <div style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.mintFaint}`,
                marginBottom: '12px',
                position: 'relative',
              }}>
                {activeColors.map((c, i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '8px',
                  background: 'linear-gradient(transparent 50%, rgba(2, 26, 26, 0.9))',
                }}>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: colors.cream,
                  }}>
                    {currentTrack.name}
                  </div>
                </div>
              </div>

              {/* Track info */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: colors.mintDim,
                }}>
                  {currentTrack.colourCount} colours · {currentTrack.category}
                </div>
                {currentTrack.audioPrompt && (
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    color: colors.mintFaint,
                    marginTop: '4px',
                    fontStyle: 'italic',
                    lineHeight: '1.4',
                  }}>
                    {currentTrack.audioPrompt.slice(0, 60)}...
                  </div>
                )}
              </div>

              {/* Waveform visualizer */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px',
                height: '40px',
                marginBottom: '12px',
              }}>
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${isPlaying ? h : 20}%`,
                      backgroundColor: activeColors[i % activeColors.length],
                      transition: 'height 0.15s ease-out',
                    }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
              }}>
                <button
                  type="button"
                  onClick={() => setShuffleMode(!shuffleMode)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: shuffleMode ? colors.bgTertiary : 'transparent',
                    border: `1px solid ${shuffleMode ? colors.mint : colors.mintFaint}`,
                    color: colors.mint,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Shuffle"
                >
                  <Shuffle size={14} />
                </button>
                <button
                  type="button"
                  onClick={prevTrack}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: `1px solid ${colors.mintFaint}`,
                    color: colors.mint,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBack size={14} />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{
                    width: '44px',
                    height: '44px',
                    background: colors.mint,
                    border: 'none',
                    color: colors.bgPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: `1px solid ${colors.mintFaint}`,
                    color: colors.mint,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForward size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: isMuted ? colors.bgTertiary : 'transparent',
                    border: `1px solid ${isMuted ? colors.mint : colors.mintFaint}`,
                    color: colors.mint,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
              color: colors.mintFaint,
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}>
              Select a palette to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PalettePlaylist;
