# 🧪 Game Arena Testing Guide

## Quick Test Checklist

### ✅ Visual Tests

#### 1. Layout & Responsiveness
- [ ] Open on desktop (1920x1080)
- [ ] Open on tablet (768x1024)
- [ ] Open on mobile (375x667)
- [ ] All elements visible at all sizes
- [ ] No horizontal scrolling
- [ ] Text is readable at all sizes
- [ ] Buttons are tap-friendly (min 48px)

#### 2. Styling & Effects
- [ ] Background gradient visible
- [ ] Animated orbs pulsing
- [ ] Grid pattern showing
- [ ] Glassmorphism blur working
- [ ] Neon glows on elements
- [ ] Scan line animating
- [ ] Corner accents visible
- [ ] Gradient text rendering correctly

#### 3. HUD Elements
- [ ] Player avatar loads
- [ ] Opponent avatar loads
- [ ] Scores display correctly (0:0 initially)
- [ ] Round shows "Round 1/7"
- [ ] Timer bar fills correctly (10 seconds)
- [ ] Timer turns red at 3 seconds
- [ ] Trophy icons visible

---

### ✅ Functional Tests

#### 1. Navigation
- [ ] Navigate from Lobby → Arena works
- [ ] Arena loads without errors
- [ ] No console errors on mount

#### 2. Countdown
- [ ] Countdown appears on start
- [ ] Shows "3" → "2" → "1" → "REACT!"
- [ ] Numbers rotate/scale smoothly
- [ ] Countdown dismisses after ~3.5s
- [ ] Game starts after countdown

#### 3. Round Play (Demo)
- [ ] Canvas shows placeholder
- [ ] Hint text updates ("Get ready...", "React fast!")
- [ ] Demo auto-completes after delay
- [ ] Round result modal appears
- [ ] Correct winner determined
- [ ] Reaction times displayed

#### 4. Round Result Modal
- [ ] Modal appears after round
- [ ] Shows correct result (win/lose)
- [ ] Icon animates (rotate + scale)
- [ ] Reaction times correct
- [ ] Time difference calculated
- [ ] "Next Round" button works
- [ ] Round progress shows (e.g., "Round 1 of 7")

#### 5. Score Tracking
- [ ] Player score increments on win
- [ ] Opponent score increments on loss
- [ ] Scores animate when changing
- [ ] Scores persist across rounds
- [ ] Final scores correct after 7 rounds

#### 6. Timer
- [ ] Timer starts at 10.0s
- [ ] Timer counts down smoothly
- [ ] Timer bar shrinks proportionally
- [ ] Timer turns red at <3s
- [ ] Timer stops when paused
- [ ] Timer resets each round

#### 7. Pause Menu
- [ ] Pause button clickable
- [ ] Pause menu appears
- [ ] Game stops when paused
- [ ] Timer freezes
- [ ] Resume button works
- [ ] Game continues from pause
- [ ] Quit button returns to lobby

#### 8. Reaction Log
- [ ] Log is empty initially
- [ ] New reactions appear on complete
- [ ] Log shows last 5 reactions
- [ ] Older entries fade out
- [ ] Slide-in animation works
- [ ] Shows player and opponent times
- [ ] Emojis display correctly

#### 9. Round Progression
- [ ] Round 1 → Round 2 works
- [ ] Countdown shows between rounds
- [ ] All 7 rounds playable
- [ ] After Round 7, game ends
- [ ] Returns to lobby after completion

---

### ✅ Animation Tests

#### 1. Countdown Overlay
- [ ] Fullscreen backdrop blur
- [ ] Numbers scale from 0.5 to 1.0
- [ ] Numbers rotate 90° on entry
- [ ] Numbers exit with scale 1.5
- [ ] "REACT!" appears with underline
- [ ] Glow effects visible

#### 2. Result Modal
- [ ] Modal scales from 0.8 to 1.0
- [ ] Icon spins from -180° to 0°
- [ ] Content fades in staggered
- [ ] Glow matches result color
- [ ] Button hover scales to 1.05

#### 3. Score Changes
- [ ] Scores scale up when changed
- [ ] Score animation smooth
- [ ] No layout shift

#### 4. Timer Bar
- [ ] Shrinks smoothly (no jumps)
- [ ] Shimmer effect animates
- [ ] Color change smooth

#### 5. Reaction Log
- [ ] Entries slide from left
- [ ] Old entries fade out
- [ ] No layout shift on add/remove

---

### ✅ Edge Cases

#### 1. Rapid Actions
- [ ] Click pause → resume rapidly
- [ ] Click next round multiple times (should not break)
- [ ] Pause during countdown (should still work)

#### 2. Timing
- [ ] Round completes at exactly 0.0s
- [ ] Multiple rounds complete back-to-back
- [ ] Pause/resume doesn't break timer

#### 3. Scores
- [ ] Player wins all 7 rounds (7:0)
- [ ] Opponent wins all 7 rounds (0:7)
- [ ] No tie state (equal times resolve to a winner)
- [ ] Close game (4:3, 5:2, etc.)

#### 4. Reaction Times
- [ ] Very fast times (50-100ms)
- [ ] Very slow times (5000ms+)
- [ ] Identical times resolve to a winner
- [ ] Time difference > 1000ms

---

### ✅ Browser Tests

#### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

#### Features to Check
- [ ] Backdrop blur support (fallback if not)
- [ ] CSS animations smooth
- [ ] Touch events work (mobile)
- [ ] No layout issues
- [ ] Fonts load correctly

---

### ✅ Performance Tests

#### 1. Frame Rate
- [ ] 60fps animations (check DevTools)
- [ ] No jank on countdown
- [ ] No jank on modal open/close
- [ ] Smooth timer countdown

#### 2. Memory
- [ ] No memory leaks (7+ rounds)
- [ ] Garbage collection working
- [ ] PixiJS cleanup on unmount
- [ ] No zombie timers

#### 3. Load Time
- [ ] Arena loads in <1 second
- [ ] Images load quickly
- [ ] No flash of unstyled content

---

### ✅ Accessibility Tests

#### 1. Keyboard Navigation
- [ ] Tab through interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals (optional)
- [ ] Focus visible on elements

#### 2. Screen Readers (Optional)
- [ ] Scores announced
- [ ] Round changes announced
- [ ] Modal titles read
- [ ] Button labels clear

#### 3. Color Contrast
- [ ] Text readable on backgrounds
- [ ] Icons visible
- [ ] Timer readable at all states

---

### ✅ Integration Tests (After PixiJS)

#### 1. PixiJS Initialization
- [ ] Canvas renders without errors
- [ ] PixiJS app mounts correctly
- [ ] Game visible in canvas
- [ ] No WebGL errors

#### 2. Game Interaction
- [ ] Click/tap events work
- [ ] Game responds to player
- [ ] Reaction time accurate
- [ ] onRoundComplete called correctly

#### 3. Cleanup
- [ ] PixiJS destroys on unmount
- [ ] No orphaned canvases
- [ ] Memory freed
- [ ] Event listeners removed

---

## 🐛 Common Issues & Fixes

### Issue: Countdown doesn't dismiss
**Check:**
- Timer in useEffect running?
- showCountdown state updating?

**Fix:**
```typescript
useEffect(() => {
  if (showCountdown) {
    const timer = setTimeout(() => {
      setShowCountdown(false);
    }, 3500);
    return () => clearTimeout(timer);
  }
}, [showCountdown]);
```

---

### Issue: Timer not counting down
**Check:**
- isPaused state?
- roundResult blocking?
- Interval cleanup?

**Fix:**
```typescript
useEffect(() => {
  if (!isPaused && !roundResult) {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }
}, [isPaused, roundResult]);
```

---

### Issue: Scores not updating
**Check:**
- handleRoundComplete logic
- useState setter called?

**Fix:**
```typescript
if (winner === 'player') {
  setPlayerScore(prev => prev + 1);
} else if (winner === 'opponent') {
  setOpponentScore(prev => prev + 1);
}
```

---

### Issue: Modal appears twice
**Check:**
- Conditional rendering
- State cleanup

**Fix:**
```typescript
{roundResult && <RoundResultModal ... />}
// Only render when roundResult is not null
```

---

### Issue: Animations laggy
**Check:**
- GPU acceleration
- Too many blur effects?
- PixiJS performance

**Fix:**
```css
.animated-element {
  transform: translateZ(0); /* Force GPU */
  will-change: transform;   /* Hint browser */
}
```

---

### Issue: Layout shifts on mobile
**Check:**
- Container heights
- Image sizes
- Viewport units

**Fix:**
```css
.arena-canvas {
  min-height: 400px; /* Prevent collapse */
  max-width: 100vw;  /* No overflow */
}
```

---

## 📊 Testing Workflow

### 1. Quick Visual Test (5 mins)
```
1. Open arena
2. Check layout looks good
3. Watch countdown
4. See one round complete
5. Check pause menu
6. Done ✓
```

### 2. Full Functional Test (15 mins)
```
1. Play all 7 rounds
2. Test pause/resume
3. Check all modals
4. Verify scores
5. Test on mobile
6. Done ✓
```

### 3. Integration Test (30 mins)
```
1. Add PixiJS game
2. Test game mechanics
3. Verify onRoundComplete
4. Check cleanup
5. Test multiple rounds
6. Profile performance
7. Done ✓
```

### 4. Production Test (60 mins)
```
1. Test all browsers
2. Test all devices
3. Performance profiling
4. Accessibility audit
5. Load testing
6. Edge cases
7. Done ✓
```

---

## 🎯 Success Criteria

### Minimum Viable (MVP)
- ✅ Arena loads
- ✅ One round playable
- ✅ Basic UI visible
- ✅ No critical errors

### Production Ready
- ✅ All 7 rounds work
- ✅ All animations smooth
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Performance good (60fps)
- ✅ PixiJS integrated

### Polished
- ✅ All browsers tested
- ✅ Accessibility good
- ✅ Edge cases handled
- ✅ Professional feel
- ✅ No bugs

---

## 🚀 Pre-Launch Checklist

- [ ] Visual design approved
- [ ] All animations smooth
- [ ] Responsive on all devices
- [ ] PixiJS game complete
- [ ] No console errors
- [ ] Performance optimized
- [ ] Tested on 5+ devices
- [ ] Multiplayer connected (if needed)
- [ ] Backend integrated (if needed)
- [ ] User tested (5+ people)
- [ ] Ready to ship! 🎉

---

## 🔌 Disconnect / Pause / Reconnect / Forfeit Manual Checklist

Use two browsers (or two devices) logged into different accounts in the same match.

1. **Disconnect once → pause → reconnect within 30s → resume**
   - Start a ranked or friend match and wait for the round to begin.
   - Kill one client’s network or close the tab.
   - **Connected player** sees: “Opponent disconnected, waiting…” + 30s countdown.
   - Reconnect the disconnected player within 30 seconds.
   - Match resumes automatically with timers continuing.

2. **Disconnect once → no reconnect → forfeit at 30s**
   - Repeat the disconnect.
   - Wait 30 seconds.
   - Connected player sees the match end and is awarded the win by forfeit.

3. **Disconnect twice → immediate forfeit**
   - Reconnect, re-enter the same match, and disconnect the same player again.
   - The second disconnect triggers an immediate forfeit (no grace window).

4. **Timers stop while paused**
   - During the disconnect pause, verify no target shows and the server timer does not advance.

5. **No double-finalize / no UI inconsistencies**
   - Ensure only one final result modal appears.
   - Ensure the pause overlay clears on resume or forfeit.

---

## 📝 Bug Report Template

```markdown
**Bug:** [Short description]

**Steps to Reproduce:**
1. Go to arena
2. Click X
3. See Y

**Expected:** Should show Z

**Actual:** Shows Y instead

**Device:** iPhone 13 Pro, iOS 16
**Browser:** Safari
**Screenshot:** [attach if possible]
```

---

## 🎉 Testing Complete!

Once all tests pass, you're ready to:
1. ✅ Deploy to staging
2. ✅ User acceptance testing
3. ✅ Deploy to production
4. ✅ Launch your game! 🚀

---

*Happy Testing! May your bugs be few and your frames high.* 🐛➡️🦋
