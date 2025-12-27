#!/usr/bin/env python3
"""
Lyria Batch Generator for PixelMilk Palette Audio

Generates batches of 6 palettes for Lyria audio generation.
Run with: python scripts/lyria-batches.py [playlist_name]

Examples:
  python scripts/lyria-batches.py                    # List all playlists
  python scripts/lyria-batches.py "Haunted Cartridge" # Get batches for that playlist
  python scripts/lyria-batches.py --all              # Output all batches
"""

import json
import sys
from pathlib import Path

# Load soundtrack data
script_dir = Path(__file__).parent
soundtrack_path = script_dir.parent / "src" / "data" / "soundtrack.json"

with open(soundtrack_path) as f:
    data = json.load(f)

# Group by playlist
playlists = {}
for pid, info in data.items():
    pl = info.get('playlist', 'Uncategorized')
    playlists.setdefault(pl, []).append((pid, info))

def print_playlist_summary():
    """Print summary of all playlists"""
    print("=" * 60)
    print("AVAILABLE PLAYLISTS")
    print("=" * 60)
    for pl, tracks in sorted(playlists.items(), key=lambda x: -len(x[1])):
        batches = (len(tracks) + 5) // 6
        print(f"  {pl}: {len(tracks)} tracks ({batches} batches)")
    print()
    print("Usage: python scripts/lyria-batches.py \"Playlist Name\"")

def print_batch(playlist_name):
    """Print batches for a specific playlist"""
    if playlist_name not in playlists:
        print(f"Playlist '{playlist_name}' not found.")
        print_playlist_summary()
        return

    tracks = playlists[playlist_name]
    print(f"\n{'='*60}")
    print(f"LYRIA BATCHES: {playlist_name}")
    print(f"{'='*60}")

    for i in range(0, len(tracks), 6):
        batch = tracks[i:i+6]
        batch_num = i // 6 + 1

        print(f"\n--- BATCH {batch_num} ({len(batch)} tracks) ---")
        print()

        # Print filenames for easy reference
        print("Filenames (for export):")
        for pid, _ in batch:
            print(f"  {pid}.wav")

        print()
        print("Audio prompts for Gemini/Lyria:")
        print("-" * 40)

        for pid, info in batch:
            prompt = info.get('audioPrompt', 'No prompt')
            bpm = info.get('bpm', '?')
            energy = info.get('energy', '?')
            print(f"\n[{pid}] ({bpm} BPM, {energy} energy)")
            print(f"  {prompt}")

        print()
        print("=" * 60)

def print_all_batches():
    """Print all batches for all playlists"""
    for pl in sorted(playlists.keys(), key=lambda x: -len(playlists[x])):
        print_batch(pl)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_playlist_summary()
    elif sys.argv[1] == "--all":
        print_all_batches()
    else:
        playlist_name = " ".join(sys.argv[1:])
        print_batch(playlist_name)
