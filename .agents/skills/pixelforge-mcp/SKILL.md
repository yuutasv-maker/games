---
name: pixelforge-mcp
description: Use when generating 2D pixel art sprites, animation sheets, retro game assets, or backgrounds using the PixelForge MCP server (powered by Google Gemini). Covers sprite generation, frame splitting, style presets, and game asset workflows.
---

# PixelForge MCP Integration Guide

PixelForge is an MCP server that generates pixel art sprites, character animations, and backgrounds using Google Gemini models with automatic background removal and downscale quantization.

## Server Location & Configuration
Repository submodule:
`vendor/pixelforge-mcp/`

Configured in `mcp_config.json`:
```json
{
  "mcpServers": {
    "pixelforge": {
      "command": "npx",
      "args": ["-y", "pixelforge-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

## Available MCP Tools

### 1. `forge_sprite`
Generates an individual pixel art sprite with automatic background removal, auto-cropping, and sizing:
- **`description`** (string, required): e.g. "retro 16-bit cyber samurai with glowing katana"
- **`outputPath`** (string, required): Relative path to save PNG, e.g. `assets/sprites/samurai.png`
- **`size`** (number, optional): Target sprite resolution (16, 24, 32, 48, 64; default 48)
- **`style`** (string, optional): Visual style preset (`clean`, `retro`, `gameboy`, `snes`, `neon`)

### 2. `forge_animation`
Generates animation frames and automatically splits them into individual frame files:
- **`description`** (string, required): e.g. "8-bit knight"
- **`action`** (string, required): e.g. "walking forward cycle", "attack slash", "jump"
- **`outputPrefix`** (string, required): Prefix for split frames, e.g. `assets/sprites/knight_walk_`
- **`frames`** (number, optional): Number of animation frames (default 3)

### 3. `forge_background`
Generates a full-scene game background without cropping or background removal:
- **`description`** (string, required): e.g. "dystopian cyberpunk city rooftop at midnight with pixel clouds"
- **`outputPath`** (string, required): Output PNG destination
- **`aspect`** (string, optional): Aspect ratio (`16:9`, `4:3`, `1:1`)

## Asset Workflow for Games
1. Generate base character sprite using `forge_sprite`.
2. Generate walk/jump animations using `forge_animation` matching the base character description.
3. Import the output PNGs directly into LittleJS / Phaser / Canvas draw routines or texture atlases.
