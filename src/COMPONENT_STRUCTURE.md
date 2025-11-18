# 🏗️ Game Arena - Component Structure

## Component Hierarchy

```
App.tsx
  └── GameArenaScreen (wrapper)
        └── GameArena (main controller)
              ├── HUD (top bar)
              ├── ArenaCanvas (PixiJS game) ⭐
              ├── BottomBar (controls)
              ├── CountdownOverlay (conditional)
              ├── PauseMenu (conditional)
              └── RoundResultModal (conditional)
```

---

## Detailed Breakdown

### 1. **App.tsx**
**Role:** Root application router

**Handles:**
- Screen navigation
- Global state (player name, wallet, etc.)
- Route to `GameArenaScreen` when `currentScreen === 'arena'`

**Props passed down:**
```typescript
<GameArenaScreen onNavigate={setCurrentScreen} />
```

---

### 2. **GameArenaScreen.tsx**
**Role:** Simple wrapper component

**Purpose:**
- Adapts arena system to app navigation
- Converts `onNavigate` callback to `onQuit`

**Code:**
```typescript
export function GameArenaScreen({ onNavigate }) {
  const handleQuit = () => onNavigate('lobby');
  return <GameArena onQuit={handleQuit} />;
}
```

---

### 3. **GameArena.tsx** (Main Controller)
**Role:** Game state management and orchestration

**State:**
```typescript
- isPaused: boolean
- showCountdown: boolean
- currentRound: number (1-7)
- playerScore: number
- opponentScore: number
- timeLeft: number (0-10)
- roundResult: 'win' | 'lose' | 'tie' | null
- playerReactionTime: number | null
- opponentReactionTime: number | null
- reactionLog: string[]
```

**Key Methods:**
```typescript
- startRound()              // Reset timer, clear result
- handleRoundComplete()     // Update scores, show result
- handleNextRound()         // Progress to next round
- handlePause()            // Show pause menu
- handleResume()           // Hide pause menu
```

**Responsibilities:**
- Game loop (timer countdown)
- Round progression
- Score calculation
- Conditional overlay rendering
- Passing props to all children

---

### 4. **HUD.tsx** (Top Bar)
**Role:** Display game status

**Props:**
```typescript
- player: { name, avatar }
- opponent: { name, avatar }
- playerScore: number
- opponentScore: number
- currentRound: number
- totalRounds: number
- timeLeft: number
- roundTime: number
```

**Displays:**
- Player avatar + name + score (left)
- Current score (center, large)
- Round indicator (center, small)
- Opponent avatar + name + score (right)
- Timer bar (bottom, changes color when low)

**Visual Features:**
- Glassmorphic container
- Gradient borders
- Animated score changes
- Pulse on low time
- Trophy icons

---

### 5. **ArenaCanvas.tsx** ⭐ (YOUR GAME)
**Role:** PixiJS game integration point

**Props:**
```typescript
- isActive: boolean           // true when game should run
- onRoundComplete: (          // callback when finished
    winner: 'player' | 'opponent' | 'tie',
    playerTime: number,
    opponentTime: number
  ) => void
```

**Your Responsibilities:**
1. Initialize PixiJS when `isActive` becomes true
2. Build your reaction game
3. Measure player reaction time
4. Call `onRoundComplete(winner, playerTime, opponentTime)`
5. Cleanup on unmount

**Current State:**
- Placeholder with instructions
- Demo auto-complete for testing
- Styled container with corners, glow, scan lines

**Integration:**
```typescript
useEffect(() => {
  if (!isActive) return;
  
  // Your PixiJS game here
  const app = new PIXI.Application({ ... });
  
  return () => app.destroy();
}, [isActive]);
```

---

### 6. **BottomBar.tsx** (Controls)
**Role:** Game controls and feedback

**Props:**
```typescript
- onPause: () => void
- reactionLog: string[]
```

**Displays:**
- Pause button (gradient, interactive)
- Reaction log section
- Last 5 reactions with animations

**Log Entry Examples:**
```
"You reacted in 234ms! 🎯"
"CryptoNinja reacted in 312ms 😅"
"Tie! Both 256ms ⚡"
```

**Visual Features:**
- Glassmorphic container
- Slide-in animations for new logs
- Fade opacity for older entries
- Zap icon indicator

---

### 7. **CountdownOverlay.tsx** (Overlay)
**Role:** Pre-round countdown animation

**Conditionally Rendered:** `{showCountdown && <CountdownOverlay />}`

**Sequence:**
1. Show "3" (rotate in, scale)
2. Show "2" (rotate in, scale)
3. Show "1" (rotate in, scale)
4. Show "REACT!" (scale in with underline)
5. Auto-dismiss

**Features:**
- Fullscreen overlay
- Backdrop blur
- 3D rotation animations
- Massive glowing numbers
- Gradient text effects

**Duration:** 3.5 seconds total

---

### 8. **PauseMenu.tsx** (Overlay)
**Role:** Pause game modal

**Conditionally Rendered:** `{isPaused && <PauseMenu />}`

**Props:**
```typescript
- onResume: () => void
- onQuit: () => void
```

**Displays:**
- Pause icon (two bars)
- "Game Paused" title
- Resume button (primary action)
- Quit to Lobby button (secondary)

**Features:**
- Fullscreen dark backdrop
- Glassmorphic modal
- Scale-in animation
- Gradient buttons

---

### 9. **RoundResultModal.tsx** (Overlay)
**Role:** Show round outcome

**Conditionally Rendered:** `{roundResult && <RoundResultModal />}`

**Props:**
```typescript
- result: 'win' | 'lose' | 'tie'
- playerReactionTime: number | null
- opponentReactionTime: number | null
- onNext: () => void
- currentRound: number
- totalRounds: number
```

**Displays:**
- Result icon (Trophy/Zap)
- Result title ("ROUND WIN!" / "ROUND LOST" / "ROUND TIE!")
- Motivational message
- Reaction time comparison
- Time difference
- Next button
- Round progress

**Visual Variants:**
- **Win:** Cyan/blue gradient, trophy icon
- **Lose:** Pink/purple gradient, zap icon
- **Tie:** Purple/cyan gradient, zap icon

**Features:**
- Fullscreen backdrop
- Animated entry (scale + rotate)
- Staggered content reveal
- Highlighted winner's time
- Gradient glows

---

## Data Flow

### Round Start
```
GameArena
  └─> showCountdown = true
        └─> CountdownOverlay renders
              └─> After 3.5s: dismiss
                    └─> startRound()
                          └─> ArenaCanvas isActive = true
```

### Round Play
```
ArenaCanvas (PixiJS game)
  └─> Player clicks
        └─> Calculate reaction time
              └─> onRoundComplete(winner, time1, time2)
                    └─> GameArena updates scores
                          └─> roundResult = 'win'/'lose'/'tie'
                                └─> RoundResultModal renders
```

### Round End
```
RoundResultModal
  └─> Player clicks "Next Round"
        └─> onNext()
              └─> GameArena.handleNextRound()
                    └─> currentRound++
                          └─> showCountdown = true
                                └─> Repeat cycle
```

### Pause
```
BottomBar
  └─> Player clicks Pause
        └─> onPause()
              └─> GameArena.isPaused = true
                    └─> PauseMenu renders
                          └─> ArenaCanvas isActive = false
```

---

## Props Flow

### From GameArena → Children

**To HUD:**
- player, opponent (static)
- playerScore, opponentScore (reactive)
- currentRound, totalRounds (reactive)
- timeLeft, roundTime (reactive)

**To ArenaCanvas:**
- isActive (computed: !paused && !countdown && !result)
- onRoundComplete (callback)

**To BottomBar:**
- onPause (callback)
- reactionLog (reactive array)

**To CountdownOverlay:**
- (no props - self-contained animation)

**To PauseMenu:**
- onResume (callback)
- onQuit (callback)

**To RoundResultModal:**
- result (reactive: 'win'/'lose'/'tie')
- playerReactionTime, opponentReactionTime (reactive)
- onNext (callback)
- currentRound, totalRounds (reactive)

---

## Event Flow

### User Actions → Effects

```
User clicks Pause
  ├─> isPaused = true
  ├─> Timer stops
  ├─> PixiJS game inactive
  └─> PauseMenu appears

User clicks Resume
  ├─> isPaused = false
  ├─> Timer resumes
  ├─> PixiJS game active
  └─> PauseMenu disappears

User clicks target in game
  ├─> PixiJS calculates time
  ├─> onRoundComplete() called
  ├─> Scores update
  └─> RoundResultModal appears

User clicks Next Round
  ├─> Round increments
  ├─> Countdown starts
  └─> Cycle repeats

User completes 7 rounds
  └─> onQuit() called
        └─> Navigate to lobby
```

---

## Styling Strategy

### Theme
- **Background:** Dark purple (#0a0118)
- **Primary:** Cyan (#06B6D4)
- **Secondary:** Purple (#9333EA)
- **Accent:** Pink (#EC4899)

### Techniques
- **Glassmorphism:** `backdrop-blur-xl` + `bg-black/40`
- **Neon Glows:** Gradient backgrounds + blur shadows
- **Depth:** Layered shadows and borders
- **Motion:** Motion/React for smooth transitions

### Responsive
- **Mobile:** Compact layouts, smaller text
- **Desktop:** Spacious layouts, larger elements
- **Breakpoint:** 768px (md:)

---

## File Dependencies

```
GameArena.tsx
  ├── import HUD
  ├── import ArenaCanvas
  ├── import BottomBar
  ├── import PauseMenu
  ├── import CountdownOverlay
  └── import RoundResultModal

All components import:
  ├── React (useState, useEffect, useRef)
  ├── Motion (motion, AnimatePresence)
  └── Lucide icons (Trophy, Clock, Play, etc.)

ArenaCanvas (your integration):
  └── import pixi.js (when you add it)
```

---

## State Machine

```
┌──────────────┐
│   LOADING    │ (initial)
└──────┬───────┘
       ↓
┌──────────────┐
│  COUNTDOWN   │ (3-2-1-React)
└──────┬───────┘
       ↓
┌──────────────┐
│   PLAYING    │ (game active, timer running)
└──────┬───────┘
       ↓
┌──────────────┐
│   RESULT     │ (modal showing outcome)
└──────┬───────┘
       ↓
   Round < 7?
    ↙      ↘
  YES       NO
   ↓         ↓
COUNTDOWN  LOBBY
```

**Pause can happen during PLAYING state**

---

## Summary

**Total Components:** 9
- 1 Wrapper (GameArenaScreen)
- 1 Controller (GameArena)
- 4 UI Components (HUD, Canvas, BottomBar, + placeholder)
- 3 Overlays (Countdown, Pause, Result)

**Lines of Code:** ~1,500
**Files Created:** 7 components + 3 docs + 1 CSS update

**Your Job:** Replace ArenaCanvas placeholder with PixiJS game (~100-300 lines)

**Result:** Production-ready Web3 game arena! 🎮⚡

---

*This structure is scalable, maintainable, and ready for production deployment.*
