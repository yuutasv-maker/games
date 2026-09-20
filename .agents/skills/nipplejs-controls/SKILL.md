---
name: nipplejs-controls
description: Use when adding virtual joystick, on-screen thumbstick, or touch controls for mobile/tablet web games using nipplejs. Covers setup, dynamic and static joystick configurations, event handling, and vector calculation for game loops.
---

# NippleJS Virtual Joystick Integration Guide

Use NippleJS to provide intuitive touch controls (virtual joysticks / D-pads) for mobile web games.

## Library Location
The source library is available at:
`vendor/nipplejs/`

Distribution file:
- UMD / Global: `vendor/nipplejs/dist/nipplejs.min.js`
- ES Module: `vendor/nipplejs/src/index.js`

## Setup Options

### 1. Static Joystick (Fixed position on screen)
Ideal for standard retro games with a fixed joystick in the bottom-left corner:
```javascript
const joystick = nipplejs.create({
  zone: document.getElementById('joystick-zone'),
  mode: 'static',
  position: { left: '80px', bottom: '80px' },
  color: '#4488ff',
  size: 100
});
```

### 2. Dynamic Joystick (Appears where touch begins)
Ideal for modern action games where the stick appears under the player's thumb:
```javascript
const dynamicJoystick = nipplejs.create({
  zone: document.getElementById('game-container'),
  mode: 'dynamic',
  color: 'rgba(255, 255, 255, 0.5)',
  size: 120
});
```

## Connecting to Game Loop

Read joystick output and apply directly to player movement velocity:

```javascript
let moveVector = { x: 0, y: 0 };

joystick.on('move', (evt, data) => {
  // data.vector gives normalized {x, y} coordinates where -1 <= x, y <= 1
  // data.distance gives deflection distance
  // data.angle gives angle in radian / degree
  if (data.vector) {
    moveVector.x = data.vector.x;
    moveVector.y = -data.vector.y; // Invert Y to match Canvas/Screen coordinate system
  }
});

joystick.on('end', () => {
  // Reset velocity when touch releases
  moveVector.x = 0;
  moveVector.y = 0;
});

// Inside your game loop (requestAnimationFrame / LittleJS update / Phaser update):
function gameUpdate(dt) {
  const speed = 200; // px/sec
  player.x += moveVector.x * speed * dt;
  player.y += moveVector.y * speed * dt;
}
```

## CSS / Layout Considerations
- Set `touch-action: none;` on game containers to prevent page scrolling, zoom, or browser pull-to-refresh while dragging the stick.
- Ensure the joystick container has a high `z-index` so touches are captured cleanly above background layers.
