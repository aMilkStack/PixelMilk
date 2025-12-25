/**
 * PaletteMiniPlayer - Floating Spotify-style mini-player for palette selection
 *
 * Fixed position bottom-right corner. Expands to full playlist modal.
 * Updates styleParams.paletteMode when a palette is selected.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle,
  Volume2, VolumeX, ChevronUp, ChevronDown, Music, X
} from 'lucide-react';
import { useCharacterStore } from '../../stores';
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
};

// Soundtrack types
interface SoundtrackEntry {
  audioPrompt: string;
  bpm: number;
  energy: 'low' | 'medium' | 'high';
}

const soundtrack = soundtrackData as Record<string, SoundtrackEntry>;

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
}

const ALL_TRACKS: Track[] = LOSPEC_PALETTES.map(p => ({
  ...p,
  hasAudio: AVAILABLE_AUDIO.has(p.id),
  bpm: soundtrack[p.id]?.bpm,
}));

const TRACKS_BY_CATEGORY: Record<PaletteCategory, Track[]> = {
  Micro: ALL_TRACKS.filter(t => t.category === 'Micro'),
  Limited: ALL_TRACKS.filter(t => t.category === 'Limited'),
  Extended: ALL_TRACKS.filter(t => t.category === 'Extended'),
  Full: ALL_TRACKS.filter(t => t.category === 'Full'),
};

export const PaletteMiniPlayer: React.FC = () => {
  const { styleParams, setStyleParams } = useCharacterStore();

  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory | 'all'>('all');
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(16).fill(20));
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get filtered tracks
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return ALL_TRACKS;
    return TRACKS_BY_CATEGORY[selectedCategory];
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
      setWaveHeights(Array(16).fill(0).map(() => 15 + Math.random() * 70));
    }, 150);
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
  const miniPlayerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    background: colors.bgPrimary,
    border: `1px solid ${colors.mintFaint}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    width: isExpanded ? '400px' : '320px',
    maxHeight: isExpanded ? '500px' : 'auto',
    transition: 'all 0.2s ease',
  };

  if (!isExpanded) {
    return (
      <div style={miniPlayerStyle}>
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
          >
            <ChevronUp size={14} />
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
              Click <ChevronUp size={10} style={{ verticalAlign: 'middle' }} /> to browse palettes
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
        )}
      </div>
    );
  }

  // ============================================
  // EXPANDED PLAYER
  // ============================================
  return (
    <div style={miniPlayerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: `1px solid ${colors.mintFaint}`,
        background: colors.bgSecondary,
      }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: colors.cream,
        }}>
          <span style={{ color: colors.mint }}>&gt;</span> Palette Playlist
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.mint,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${colors.mintFaint}`,
        background: colors.bgSecondary,
        flexWrap: 'wrap',
      }}>
        {(['all', 'Micro', 'Limited', 'Extended', 'Full'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 10px',
              background: selectedCategory === cat ? colors.bgTertiary : 'transparent',
              border: 'none',
              borderBottom: selectedCategory === cat ? `2px solid ${colors.mint}` : '2px solid transparent',
              color: selectedCategory === cat ? colors.mint : colors.mintDim,
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        maxHeight: '280px',
      }}>
        {filteredTracks.map((track, idx) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <button
              key={track.id}
              onClick={() => selectTrack(track)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 12px',
                background: isActive ? `${colors.mint}15` : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${colors.mintFaint}30`,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: colors.mintFaint,
                width: '20px',
              }}>
                {isActive && isPlaying ? '>' : String(idx + 1).padStart(2, '0')}
              </span>

              {/* Color preview */}
              <div style={{ display: 'flex', gap: '1px' }}>
                {track.colors.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ width: '10px', height: '10px', backgroundColor: c }} />
                ))}
              </div>

              <span style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '11px',
                color: isActive ? colors.cream : colors.mint,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {track.name}
                {track.hasAudio && (
                  <Volume2 size={8} style={{ marginLeft: '4px', opacity: 0.5 }} />
                )}
              </span>

              <span style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                color: colors.mintFaint,
              }}>
                {track.colourCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Now Playing footer */}
      {currentTrack && (
        <div style={{
          borderTop: `1px solid ${colors.mintFaint}`,
          padding: '10px 12px',
          background: colors.bgSecondary,
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Album art */}
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${colors.mintFaint}`,
            }}>
              {activeColors.slice(0, 5).map((c, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </div>

            {/* Waveform */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              height: '30px',
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
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => setShuffleMode(!shuffleMode)} style={{
                ...iconBtnStyle,
                background: shuffleMode ? colors.bgTertiary : 'transparent',
              }}>
                <Shuffle size={10} />
              </button>
              <button onClick={prevTrack} style={iconBtnStyle}><SkipBack size={12} /></button>
              <button onClick={togglePlay} style={playBtnStyle}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={nextTrack} style={iconBtnStyle}><SkipForward size={12} /></button>
              <button onClick={() => setIsMuted(!isMuted)} style={{
                ...iconBtnStyle,
                background: isMuted ? colors.bgTertiary : 'transparent',
              }}>
                {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
              </button>
            </div>
          </div>
        </div>
      )}
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

export default PaletteMiniPlayer;
