# 🎮 REFLEX Fullscreen Feature Guide

## 📍 Where is the Fullscreen Toggle?

The fullscreen toggle is located in the **top-right corner** of the game arena screen.

```
┌─────────────────────────────────────────┐
│  [Avatar] YOU  2:1  OPPONENT [Avatar] ⛶│ ← Toggle here
│                                         │
│              GAME ARENA                 │
│           (PixiJS Canvas)               │
│                                         │
│  [Pause]        [REACT BUTTON]          │
└─────────────────────────────────────────┘
```

### Visual Appearance:
- **Icon**: Maximize icon (⛶) with 4 outward-facing corners
- **Size**: 36×40px (mobile) / 40×40px (desktop)
- **Style**: 
  - Dark background with glassmorphism
  - White border
  - Glows cyan/purple on hover (desktop)
  - Tooltip appears on hover: "Fullscreen"

---

## 🌐 How It Works in Browser

### **Normal Flow (Non-Fullscreen)**

When you start the game from the loading page:

```
┌────────────────────────────────────────────┐
│ ← → ⟳  https://reflex-game.com     ⊞ ✕   │ ← Browser chrome
├────────────────────────────────────────────┤
│  [Avatar] YOU  2:1  OPPONENT [Avatar]  ⛶  │ ← Game HUD
├────────────────────────────────────────────┤
│                                            │
│              GAME ARENA                    │
│          Canvas fits viewport              │
│                                            │
├────────────────────────────────────────────┤
│  [Pause]        [REACT BUTTON]             │ ← Bottom bar
└────────────────────────────────────────────┘
```

**Key Points:**
- Game takes full viewport height (`min-h-screen`)
- Works perfectly in browser window
- Scrollable if content exceeds viewport
- Canvas auto-sizes responsively
- Fullscreen toggle is always visible

---

### **After Clicking Fullscreen Toggle**

#### **Desktop Browser (Chrome/Firefox/Safari):**
```
┌────────────────────────────────────────────┐
│  [Avatar] YOU  2:1  OPPONENT [Avatar]  ⊟  │ ← Minimize icon
│                                            │
│              GAME ARENA                    │
│         (Fills entire screen)              │
│                                            │
│  [Pause]        [REACT BUTTON]             │
└────────────────────────────────────────────┘
← No browser chrome, pure game
```

**Changes:**
- Browser toolbar/tabs hidden
- Full native OS fullscreen
- Icon changes to Minimize (⊟)
- Press ESC or click icon to exit
- Smooth 0.3s transition

---

#### **Mobile Browser (< 640px):**
```
┌────────────────────────────────────────────┐
│ 14:32        • REFLEX •      📶📡🔋95%    │ ← Custom status bar
├────────────────────────────────────────────┤
│  [Avatar] YOU  2:1  OPPONENT [Avatar]  ⊟  │ ← Game HUD
│                                            │
│              GAME ARENA                    │
│                                            │
│  [Pause]        [REACT BUTTON]             │
└────────────────────────────────────────────┘
```

**Mobile-Specific Changes:**
- Custom status bar replaces browser UI
- Shows: Time, "REFLEX" branding, Signal/WiFi/Battery
- Browser chrome completely hidden
- Immersive gaming experience
- Tap icon to exit fullscreen

---

## 🎬 Transition Animation

### **Enter Fullscreen (0.3s):**
```
1. User taps/clicks Maximize icon ⛶
   ↓
2. Icon rotates -90° → 0° → 90°
   ↓
3. Browser enters fullscreen API
   ↓
4. Container scales/fades (0.3s ease-out)
   ↓
5. Mobile: Status bar slides down from top
   ↓
6. Icon changes to Minimize ⊟
```

### **Exit Fullscreen (0.3s):**
```
1. User taps/clicks Minimize icon ⊟
   ↓
2. Icon rotates 90° → 0° → -90°
   ↓
3. Mobile: Status bar slides up
   ↓
4. Browser exits fullscreen API
   ↓
5. Container scales/fades back (0.3s ease-out)
   ↓
6. Icon changes to Maximize ⛶
```

---

## 📱 Responsive Behavior

### **Mobile (< 640px):**
- Toggle: 36px × 36px
- Position: 12px from top-right (with safe area)
- Custom status bar shows when fullscreen
- Bottom sheet modals
- Compact HUD

### **Tablet (640-1024px):**
- Toggle: 40px × 40px
- Position: 16px from top-right
- Native fullscreen (no custom status bar)
- Standard modals
- Expanded HUD

### **Desktop (1024px+):**
- Toggle: 40px × 40px
- Position: 16px from top-right
- Native fullscreen
- Hover effects + tooltip
- Full HUD with reaction log

---

## 🎯 Use Cases

### **When to Use Fullscreen:**

✅ **Competitive matches** - Maximize focus, no distractions
✅ **Tournaments** - Professional gaming experience
✅ **Practice mode** - Better immersion
✅ **Mobile gaming** - Hide browser UI, more screen space
✅ **Public demos** - Show game on large displays

### **Normal Browser Mode:**

✅ **Quick matches** - Easy to switch tabs
✅ **Casual play** - Multitasking friendly
✅ **Testing** - Developer console accessible
✅ **Streaming** - Easy to overlay browser elements

---

## 🔧 Technical Details

### **Browser Compatibility:**

| Browser | Fullscreen API | Custom Status Bar |
|---------|----------------|-------------------|
| Chrome Mobile | ✅ | ✅ (< 640px) |
| Safari iOS | ✅ | ✅ (< 640px) |
| Firefox Mobile | ✅ | ✅ (< 640px) |
| Chrome Desktop | ✅ | ❌ (not needed) |
| Firefox Desktop | ✅ | ❌ (not needed) |
| Safari Desktop | ✅ | ❌ (not needed) |
| Edge | ✅ | ❌ (not needed) |

### **Fallback Behavior:**
- If Fullscreen API not supported: Button hidden
- If API fails: Toast notification shown
- State managed in React: `isFullscreen` boolean
- Safe area aware: Respects notch/home indicator

---

## 🎨 Visual States

### **Windowed State:**
```css
Icon: Maximize (⛶)
Background: bg-black/60
Border: border-white/20
Tooltip: "Fullscreen"
```

### **Fullscreen State:**
```css
Icon: Minimize (⊟)
Background: bg-black/60
Border: border-white/20
Tooltip: "Exit"
```

### **Hover State (Desktop):**
```css
Background: bg-black/80
Border: border-white/40
Glow: Cyan → Purple → Pink gradient
Scale: 1.1x
```

### **Active/Tap State:**
```css
Scale: 0.9x (pressed)
Duration: 0.2s
```

---

## 🐛 Troubleshooting

### **Toggle Not Visible:**
- Check: `z-index: 50` applied
- Verify: Not covered by modals/overlays
- Ensure: GameArena component mounted
- Test: Try in different browsers

### **Fullscreen Not Working:**
- Browser may require user gesture
- Check console for API errors
- Some browsers block in iframes
- HTTPS required on some platforms

### **Status Bar Not Showing (Mobile):**
- Check: `window.innerWidth < 640`
- Verify: `isFullscreen === true`
- Ensure: CustomStatusBar rendered
- Test: Try in mobile browser

### **Exit Fullscreen Not Working:**
- Press ESC key (alternative)
- Check browser permissions
- Try clicking toggle again
- Refresh page if stuck

---

## 📐 Layout Measurements

### **Game Arena Dimensions:**

**Mobile:**
- Viewport: 375px wide (typical)
- Canvas: 351px × 263px (4:3 ratio)
- HUD Height: ~60px
- Bottom Bar: ~80px
- Toggle Position: `top: 12px, right: 12px`

**Desktop:**
- Viewport: 1920px wide (typical)
- Canvas: 800px × 500px
- HUD Height: ~120px
- Bottom Bar: ~120px
- Toggle Position: `top: 16px, right: 16px`

---

## 🎮 User Experience

### **Expected Behavior:**

1. **Game loads** → Normal browser window
2. **User clicks toggle** → Smooth transition to fullscreen
3. **Mobile only** → Custom status bar appears
4. **All platforms** → More immersive gameplay
5. **User clicks toggle** → Returns to windowed mode
6. **ESC key** → Also exits fullscreen (browser default)

### **Accessibility:**

- ✅ ARIA label: "Enter fullscreen" / "Exit fullscreen"
- ✅ Keyboard accessible (tab navigation)
- ✅ Clear visual feedback
- ✅ Tooltip for context
- ✅ Works with screen readers

---

## 💡 Tips

**For Players:**
- Use fullscreen for ranked matches
- ESC key is quick exit
- Status bar shows real time on mobile
- Works great with "Do Not Disturb" mode

**For Developers:**
- Toggle appears automatically
- No configuration needed
- State managed in parent component
- Safe area CSS variables used
- Cross-browser tested

---

## 📊 Summary

| Feature | Windowed | Fullscreen |
|---------|----------|------------|
| Browser UI | ✅ Visible | ❌ Hidden |
| Custom Status Bar (Mobile) | ❌ | ✅ |
| Screen Space | Normal | Maximized |
| Icon | Maximize ⛶ | Minimize ⊟ |
| Transition | N/A | 0.3s smooth |
| ESC Key Exit | N/A | ✅ Works |

---

**Last Updated**: 2024  
**Component**: `/components/arena/FullscreenToggle.tsx`  
**Version**: 1.0.0
