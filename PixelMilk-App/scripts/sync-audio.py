#!/usr/bin/env python3
"""
Sync AVAILABLE_AUDIO set with actual audio files in public/audio/

Run after adding new audio files:
  python scripts/sync-audio.py

This will update PalettePlaylist.tsx with the current audio files.
"""

import re
from pathlib import Path

script_dir = Path(__file__).parent
project_root = script_dir.parent

audio_dir = project_root / "public" / "audio"
playlist_file = project_root / "src" / "components" / "character" / "PalettePlaylist.tsx"

# Find all .wav files
audio_files = sorted([f.stem for f in audio_dir.glob("*.wav")])

print(f"Found {len(audio_files)} audio files:")
for f in audio_files:
    print(f"  - {f}")

# Generate the new AVAILABLE_AUDIO set
set_content = "const AVAILABLE_AUDIO = new Set([\n"
for f in audio_files:
    set_content += f"  '{f}',\n"
set_content += "]);"

print()
print("Generated set:")
print(set_content)

# Read the current file
with open(playlist_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the AVAILABLE_AUDIO set using regex
pattern = r"const AVAILABLE_AUDIO = new Set\(\[\n(?:  '[^']+',\n)*\]\);"
new_content = re.sub(pattern, set_content, content)

if new_content != content:
    with open(playlist_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print()
    print(f"Updated {playlist_file.name} with {len(audio_files)} audio files.")
else:
    print()
    print("No changes needed - file already up to date.")
