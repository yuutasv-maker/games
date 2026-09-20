---
name: zzfxm-audio
description: Use when adding retro/chiptune BGM, melodies, or sound effects (SFX) to a lightweight HTML5/JavaScript game using ZzFXM and ZzFX. Covers sound generation, song playback, audio buffer control, and integration with game loops.
---

# ZzFXM Audio Integration Guide

Use ZzFX and ZzFXM for lightweight, zero-asset chiptune audio and sound effects in web games.

## Library Location
The source library is available at:
`vendor/ZzFXM/`

Key distribution files:
- Minimal music player: `vendor/ZzFXM/zzfxm.min.js`
- Full ZzFX sound engine: `vendor/ZzFXM/zzfx.js`
- Built-in online tracker / authoring: `vendor/ZzFXM/tools/tracker/`

## Basic Usage

### 1. Include or Bundle ZzFX & ZzFXM
In HTML or modular JS:
```html
<script src="vendor/ZzFXM/zzfx.js"></script>
<script src="vendor/ZzFXM/zzfxm.min.js"></script>
```

### 2. Sound Effect (SFX) One-Liner
`zzfx(...)` generates and plays sound procedurally without external MP3/WAV files:
```javascript
// Example: Jump / Blip sound
zzfx(...[1.0, 0, 440, .05, .1, .2, 1, 1.5]); 
```

### 3. Background Music (BGM)
ZzFXM songs are defined as nested arrays:
```javascript
// Song structure: [instruments, patterns, sequence, BPM, metadata]
const mySong = [
  // Instruments (ZzFX parameter arrays)
  [
    [.9, 0, 143, , , .35, 3],
    [1, 0, 216, , , .45, 1, 4, , , 50]
  ],
  // Patterns (Channels, note pitches, attenuations)
  [
    [
      [0, -1, 1, 0, 0, 0, 3.5, 0, 0, 0], // Channel 0 (left)
      [1, 1, 2, 2.25, 3.5, 4.75, -1, 0, 0, 0] // Channel 1 (right)
    ]
  ],
  // Sequence (order of pattern indices)
  [0, 0],
  // BPM
  125
];

// Generate AudioBuffer
const songData = zzfxM(...mySong);

// Play song (returns an AudioBufferSourceNode)
const bgmNode = zzfxP(...songData);
bgmNode.loop = true; // Enable looping for BGM

// Stop playback
// bgmNode.stop();
```

## Best Practices
1. **User Gesture Requirement**: Browsers block AudioContext until a user interaction (click, keydown, touchstart). Always initialize or resume audio on the first user input.
2. **Memory Efficiency**: Render song buffers (`zzfxM(...)`) once during game initialization, and reuse the buffer with `zzfxP(...)` during gameplay.
3. **Volume Balancing**: Attenuate channels using the fractional pitch notation (e.g. `pitch + volumeAttenuation`) to keep sound balanced.
