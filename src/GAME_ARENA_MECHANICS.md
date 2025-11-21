# Game Arena - Reaction Game Mechanics

## Overview
The Game Arena is a fast-paced Web3 reaction game where players compete to identify and react to specific shape-color combinations as quickly as possible.

## Game Flow

### 1. Countdown Phase
- Shows "GET READY" (1 second)
- Counts down: 3... 2... 1... (3 seconds)
- Shows "REACT NOW!" (0.8 seconds)
- Total: ~4.8 seconds

### 2. Waiting Phase
- PixiJS canvas spawns random geometric shapes (circles, squares, triangles)
- Shapes appear in random colors, sizes, and positions
- Multiple shapes spawn continuously
- Target hint panel shows what to look for (e.g., "Click the green circle")
- Reaction button is disabled (shows "WAIT...")

### 3. Active Phase (Target Appears)
- Target shape-color combination appears on canvas
- Target hint panel highlights (animated pulse)
- Reaction button becomes active (shows "REACT!")
- Player must click the reaction button as fast as possible
- Timer starts recording from when target appears

### 4. Result Phase
- Shows round result modal with:
  - Win/Lose/Tie status
  - Player reaction time
  - Opponent reaction time (AI simulated 200-500ms)
  - Time difference
  - Next round button

## Game Rules

### Rounds
- **Total Rounds**: 3 (not 7 as in original design)
- Best of 3 wins determines the overall winner

### Scoring
- Fastest reaction time wins the round
- Winner gets 1 point
- Tie if both players have identical times (rare)

### Target Combinations
Available targets (randomly selected each round):
- Green Circle
- Red Square
- Blue Triangle
- Yellow Circle
- Purple Square
- Cyan Triangle

## Technical Implementation

### Components
1. **GameArena.tsx** - Main game orchestrator
2. **CountdownOverlay.tsx** - Pre-round countdown
3. **HUD.tsx** - Player info, scores, round indicator
4. **ArenaCanvas.tsx** - PixiJS game canvas with shape spawning
5. **TargetHintPanel.tsx** - Shows current target to find
6. **BottomBar.tsx** - Reaction button and log
7. **RoundResultModal.tsx** - End-of-round results
8. **PauseMenu.tsx** - Pause functionality

### Game States
```typescript
type GameState = 'countdown' | 'waiting' | 'active' | 'result';
```

### PixiJS Shape System
- **Shapes**: Circle, Square, Triangle
- **Colors**: Red, Green, Blue, Yellow, Purple, Cyan, Orange, Pink
- **Spawn Rate**: Random intervals (800ms average)
- **Lifespan**: 2-4 seconds with fade in/out
- **Size**: Random 20-50px radius

### Reaction Time Calculation
```typescript
reactionTime = Date.now() - targetAppearTime
```

### AI Opponent
- Simulated reaction time: 200-500ms
- Adds realism and competitive feel
- Can be replaced with real multiplayer

## Visual Design

### Glassmorphism & Neon Aesthetics
- Dark background: `#0a0118` to `#1a0836`
- Neon accents: Cyan (`#00FFA3`), Purple (`#7C3AED`), Pink
- Glassmorphism panels with backdrop blur
- Gradient orbs and glow effects

### Animations
- Shape spawning: Fade in/out
- Target appearance: Pulse effect
- Score updates: Scale animation
- Countdown: 3D rotation effect

### Responsive Design
- Mobile-first approach
- Scales from 320px to 4K displays
- Touch-friendly reaction button

## Future Enhancements

### Potential Features
1. **Real multiplayer** - Replace AI with WebSocket connections
2. **Power-ups** - Slow time, reveal target early, etc.
3. **Difficulty levels** - More shapes, faster spawning
4. **Combo system** - Consecutive wins multiply points
5. **Global leaderboard** - Top reaction times
6. **Tournament mode** - Best of 5, 7, etc.
7. **Custom shapes** - NFT-based shape skins
8. **Sound effects** - Audio feedback for reactions

### Blockchain Integration
- Record reaction times on-chain
- NFT rewards for top performers
- Stake SOL to compete
- 15% platform fee on stakes
- Automated winner payouts

## Performance Considerations

### PixiJS Optimization
- Max 20 shapes on screen simultaneously
- Destroy shapes after fadeout
- Use object pooling for better performance
- Limit particle effects on mobile

### Network Optimization
- Minimal data transfer per round
- Local AI opponent (no latency)
- State synchronization only at round end
- Deterministic random seed for fairness

## Testing Checklist

- [ ] Countdown displays correctly (no skipped numbers)
- [ ] Target appears within 1-3 seconds
- [ ] Reaction button only works when active
- [ ] Correct reaction times recorded
- [ ] Score updates properly
- [ ] All 5 rounds complete successfully (or match ends early at 3 wins)
- [ ] Result screen shows after match ends (max round 5)
- [ ] Pause/resume works correctly
- [ ] Responsive on mobile and desktop
- [ ] No memory leaks from PixiJS

---

**Last Updated**: November 11, 2025
**Version**: 1.0.0
