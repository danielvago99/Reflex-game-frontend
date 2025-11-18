# PixiJS Game Arena Integration Guide

## 🎮 Overview

Your Web3 Game Arena is ready! The UI is complete with all the features you requested. Now you can integrate your custom PixiJS game into the arena.

---

## ✅ What's Already Built

### 1. **Complete UI System**
- ✅ Fullscreen responsive design (mobile + desktop)
- ✅ Top HUD (player avatars, scores, round indicator, timer)
- ✅ Bottom bar (pause button, reaction log)
- ✅ Neon cyber aesthetic with glassmorphism
- ✅ All overlays and modals

### 2. **Game Components**
- ✅ `GameArena.tsx` - Main game controller
- ✅ `HUD.tsx` - Top heads-up display
- ✅ `ArenaCanvas.tsx` - **Your PixiJS integration point**
- ✅ `BottomBar.tsx` - Controls and reaction log
- ✅ `PauseMenu.tsx` - Pause overlay
- ✅ `CountdownOverlay.tsx` - 3-2-1-React countdown
- ✅ `RoundResultModal.tsx` - Win/lose/tie modal

### 3. **Game Flow**
```
Start Game
    ↓
3-2-1-React Countdown
    ↓
Round Begins (Timer starts)
    ↓
Player reacts in game
    ↓
Round Result Modal (Win/Lose/Tie with reaction times)
    ↓
Next Round or Game Over
```

---

## 🔨 How to Integrate Your PixiJS Game

### Step 1: Install PixiJS

```bash
npm install pixi.js
```

### Step 2: Open the Integration Point

Navigate to: `/components/arena/ArenaCanvas.tsx`

This is where your PixiJS game will live!

### Step 3: Replace the Placeholder

Here's a complete example of integrating PixiJS:

```typescript
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

interface ArenaCanvasProps {
  isActive: boolean;
  onRoundComplete: (winner: 'player' | 'opponent' | 'tie', playerTime: number, opponentTime: number) => void;
}

export function ArenaCanvas({ isActive, onRoundComplete }: ArenaCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const gameStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    // Initialize PixiJS Application
    const app = new PIXI.Application({
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
      backgroundColor: 0x0a0118,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    pixiAppRef.current = app;

    // Start your game
    initializeGame(app);

    // Cleanup
    return () => {
      app.destroy(true, { children: true, texture: true });
      pixiAppRef.current = null;
    };
  }, [isActive]);

  const initializeGame = (app: PIXI.Application) => {
    // Record when game starts
    gameStartTimeRef.current = Date.now();

    // Example: Create a clickable circle that changes color
    const targetColor = Math.random() > 0.5 ? 0x06B6D4 : 0xEC4899; // Cyan or Pink
    
    const circle = new PIXI.Graphics();
    circle.beginFill(targetColor);
    circle.drawCircle(0, 0, 80);
    circle.endFill();
    circle.x = app.screen.width / 2;
    circle.y = app.screen.height / 2;
    circle.interactive = true;
    circle.buttonMode = true;

    // Add glow effect
    circle.filters = [new PIXI.filters.BlurFilter(10)];

    // Handle player click
    circle.on('pointerdown', () => {
      const playerReactionTime = Date.now() - gameStartTimeRef.current;
      const opponentReactionTime = 150 + Math.random() * 200; // Simulated
      
      const winner = playerReactionTime < opponentReactionTime ? 'player' : 'opponent';
      
      onRoundComplete(winner, Math.round(playerReactionTime), Math.round(opponentReactionTime));
    });

    app.stage.addChild(circle);

    // Pulse animation
    let elapsed = 0;
    app.ticker.add((delta) => {
      elapsed += delta;
      circle.scale.x = 1 + Math.sin(elapsed * 0.1) * 0.1;
      circle.scale.y = 1 + Math.sin(elapsed * 0.1) * 0.1;
    });
  };

  return (
    <div className="relative w-full h-full max-w-4xl mx-auto">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
      
      <div 
        ref={canvasRef}
        className="relative bg-black/40 backdrop-blur-lg border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] md:min-h-[500px]"
      >
        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-400/50 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-pink-400/50 pointer-events-none"></div>
      </div>
    </div>
  );
}
```

---

## 🎯 Game Ideas You Can Build

### 1. **Color Match Game**
Players must click the correct color before opponent

```typescript
// Show 4 colored circles
// One matches the instruction "Click CYAN!"
// First to click correct color wins
```

### 2. **Shape Reaction**
React to the correct shape appearing

```typescript
// Random shapes appear (circle, square, triangle)
// Click the target shape fastest
```

### 3. **Memory Sequence**
Remember and repeat a color/shape sequence

```typescript
// Flash sequence: RED → BLUE → GREEN
// Player must click in same order
// Fastest correct sequence wins
```

### 4. **Moving Target**
Click a moving object

```typescript
// Circle bounces around screen
// First accurate click wins
```

### 5. **Reflex Test**
Pure reaction time test

```typescript
// Screen goes dark
// Wait for color change
// Click immediately
// Fastest reaction wins
```

---

## 📊 How the Callback Works

When a round is complete, call `onRoundComplete`:

```typescript
onRoundComplete(
  winner,              // 'player' | 'opponent' | 'tie'
  playerReactionTime,  // number in milliseconds
  opponentReactionTime // number in milliseconds
);
```

**Example:**
```typescript
// Player won with 245ms vs opponent's 312ms
onRoundComplete('player', 245, 312);
```

The UI will automatically:
- Show round result modal
- Display reaction times
- Update scores
- Show next round countdown
- Handle game completion after 7 rounds

---

## 🎨 Styling Tips

Your PixiJS canvas inherits the Web3 cyber aesthetic:

**Brand Colors (use in PixiJS):**
- Cyan: `0x06B6D4` or `0x0EA5E9`
- Purple: `0x9333EA` or `0x7C3AED`
- Pink: `0xEC4899` or `0xF472B6`
- Background: `0x0a0118`

**Effects to Match UI:**
```typescript
// Glow filter
const glow = new PIXI.filters.BlurFilter(4);
sprite.filters = [glow];

// Neon outline
const outline = new PIXI.Graphics();
outline.lineStyle(2, 0x06B6D4, 1);
outline.drawCircle(0, 0, 50);
```

---

## 🔄 Game State Management

The arena handles these for you:
- ✅ Pause state (game pauses when menu opens)
- ✅ Round timer (10 seconds per round)
- ✅ Score tracking
- ✅ Round progression
- ✅ Reaction logging

You only need to:
1. Initialize your game when `isActive` becomes `true`
2. Call `onRoundComplete` when player finishes
3. Clean up PixiJS on unmount

---

## 🌐 Multiplayer Integration (Future)

For real multiplayer via WebSocket:

```typescript
// In ArenaCanvas.tsx
import { useWebSocket } from '../../hooks/useWebSocket';

const { send } = useWebSocket();

// When player clicks
const handlePlayerAction = () => {
  const reactionTime = Date.now() - gameStartTimeRef.current;
  
  // Send to server
  send('game:action', {
    sessionId: 'current-session',
    reactionTime,
  });
};

// Receive opponent's result
useGameEvents({
  onOpponentAction: (data) => {
    const { opponentTime } = data;
    const winner = playerTime < opponentTime ? 'player' : 'opponent';
    onRoundComplete(winner, playerTime, opponentTime);
  }
});
```

---

## 🚀 Quick Start Checklist

- [ ] Install PixiJS: `npm install pixi.js`
- [ ] Open `/components/arena/ArenaCanvas.tsx`
- [ ] Replace placeholder with your PixiJS code
- [ ] Test game flow (countdown → play → result)
- [ ] Adjust timing/difficulty
- [ ] Add visual effects
- [ ] Test on mobile and desktop
- [ ] Ready to ship! 🎉

---

## 📱 Responsive Design

The canvas automatically scales. For best results:

```typescript
// Make game elements relative to screen size
const circleRadius = Math.min(app.screen.width, app.screen.height) * 0.15;

// Handle window resize
window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});
```

---

## 🐛 Debugging Tips

**Common issues:**

1. **Canvas not showing:** Check that `canvasRef.current` exists
2. **Game not starting:** Verify `isActive` prop is true
3. **Memory leaks:** Always destroy PixiJS app in cleanup
4. **Performance:** Use `app.ticker` instead of `setInterval`

**Debug mode:**
```typescript
console.log('Game active:', isActive);
console.log('Canvas ref:', canvasRef.current);
console.log('PixiJS app:', pixiAppRef.current);
```

---

## 🎉 You're Ready!

Your futuristic Web3 Game Arena is complete with:
- ✅ Beautiful neon cyber UI
- ✅ Smooth animations and transitions
- ✅ Complete game flow (7 rounds)
- ✅ Pause menu, countdowns, results
- ✅ Reaction time tracking
- ✅ Fully responsive design

Now build your amazing PixiJS game! 🚀

For questions or issues, refer to:
- [PixiJS Documentation](https://pixijs.download/release/docs/index.html)
- [PixiJS Examples](https://pixijs.io/examples/)

Good luck! ⚡
