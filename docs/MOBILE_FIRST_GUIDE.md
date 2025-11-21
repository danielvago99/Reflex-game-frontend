# 📱 REFLEX - Mobile-First Optimization Guide

## Overview
This document outlines the comprehensive mobile-first redesign of the REFLEX game, optimized for older/smaller phones with low CPU/GPU and screens as small as 320px.

---

## 🎯 Key Optimizations

### 1. **Responsive Breakpoints**
Mobile-first design using Tailwind breakpoints:
- **Base (0-639px)**: Mobile devices (320-639px)
- **sm (640px+)**: Small tablets
- **md (768px+)**: Tablets
- **lg (1024px+)**: Desktop
- **xl (1280px+)**: Large desktop

### 2. **Typography Scaling**
```css
/* Mobile base: 14px */
:root { --font-size: 14px; }

/* Scale up at 640px+ */
@media (min-width: 640px) {
  :root { --font-size: 16px; }
}
```

**Text Size Guidelines:**
- Mobile: `text-xs` (12px), `text-sm` (14px), `text-base` (14px)
- Tablet: `text-sm` (14px), `text-base` (16px), `text-lg` (18px)
- Desktop: `text-base` (16px), `text-lg` (18px), `text-xl` (20px)

### 3. **Safe Area Support**
```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

Applied to:
- HUD (top padding)
- BottomBar (bottom padding)
- All modals/sheets

---

## 🎮 Component Optimizations

### **Fullscreen Toggle**

**Features:**
- Small icon button (36×40px) in top-right corner
- Smooth 0.3s animation on state change
- Icon rotates during transition
- Hover tooltip (desktop only)
- Safe area aware positioning

**Mobile Behavior:**
- Shows custom status bar when fullscreen
- Status bar displays: time, REFLEX branding, signal/wifi/battery
- Replaces browser chrome with in-game UI
- Maintains safe area padding

**Desktop Behavior:**
- Standard fullscreen toggle
- No custom status bar (uses native)
- Hover glow effect

### **HUD (Header)**

**Mobile (< 640px):**
- Ultra-compact single bar
- Avatar: 28px (7 × 4px)
- Score: text-lg (18px)
- Round indicator: text-[10px]
- Minimal padding: p-2
- Lite border glow (opacity 20%)

**Tablet/Desktop (640px+):**
- Full layout with trophies
- Avatar: 40px → 48px → 64px
- Score: text-2xl → text-3xl → text-5xl
- Standard padding: p-3 → p-4 → p-6
- Enhanced glows (opacity 30%)

### **BottomBar**

**Mobile (< 640px):**
- Horizontal thumb-zone layout
- Pause button: 44×44px (left)
- REACT button: Full width, 52px height
- Reaction log: Hidden
- Lite glow effects

**Tablet/Desktop (640px+):**
- Multi-column layout
- REACT button: Centered, larger
- Pause button: Right side
- Reaction log: Visible (lg only)

### **Arena Canvas (PixiJS)**

**Responsive Dimensions:**
```javascript
// Mobile (< 640px)
width: min(viewportWidth - 24, 360)
height: width × 0.75  // 4:3 aspect ratio

// Tablet (640-768px)
width: min(viewportWidth - 48, 560)
height: 380

// Tablet+ (768-1024px)
width: 680
height: 450

// Desktop (1024px+)
width: 800
height: 500
```

**Performance:**
- Reduced resolution on mobile
- Lighter border glows
- Optimized shape spawning

### **Modals & Overlays**

**Mobile Design Pattern:**
All modals use **bottom sheet** pattern on mobile:
- Slide up from bottom
- Drag handle indicator
- Full width
- Safe area padding
- Max height: 85vh with scroll

**Optimized Modals:**
1. **HowToPlayOverlay**
   - Bottom sheet (mobile)
   - Modal (desktop)
   - Scrollable content
   - Close button (desktop only)

2. **PauseMenu**
   - Bottom sheet with auto-resume timer
   - Compressed warnings
   - Large tap targets (52px)

3. **CountdownOverlay**
   - Reduced blur radius (60px → 80px → 100px)
   - Smaller numbers on mobile
   - Lite glow effects

---

## ⚡ Performance Optimizations

### **GPU Effects Reduction**

**Mobile (< 640px):**
```css
/* Lite glows */
blur-sm      /* 4px instead of 8px */
opacity-10   /* 10% instead of 30% */

/* Smaller blur radiuses */
blur-[60px]  /* instead of 100px */
```

**Desktop:**
```css
/* Full effects */
blur-lg, blur-xl
opacity-30, opacity-50
blur-[100px]
```

### **Reduce Motion Support**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-pulse,
  .animate-spin,
  .animate-bounce {
    animation: none !important;
  }
}
```

### **Conditional Effects**
- Decorative floating graphics: `hidden sm:block`
- Heavy blur backgrounds: Reduced on mobile
- Multiple shadow layers: Single shadow on mobile
- Reaction log: Desktop only (`hidden lg:block`)

---

## 🎨 Design System

### **Glassmorphism Lite (Mobile)**
```css
/* Standard desktop */
backdrop-blur-xl  /* 24px */
bg-black/40
border-2

/* Mobile lite */
backdrop-blur-sm  /* 8px */
bg-black/60
border
```

### **Tap Targets**
**Minimum Sizes:**
- Primary buttons: 52px height
- Secondary buttons: 48px height
- Icon buttons: 44×44px
- Interactive elements: 44px min

**Spacing:**
- Mobile gap: `gap-2` (8px)
- Desktop gap: `gap-4` (16px)

### **Color Contrast**
All text maintains **WCAG AA** contrast:
- White text on dark: `#FFFFFF` on `#0B0F1A` (15.8:1)
- Cyan accent: `#00FFA3` (high contrast)
- Gray text: `#9CA3AF` on dark (4.5:1+)

---

## 📐 Layout Patterns

### **Mobile-First Grid**
```tsx
{/* Mobile: full width */}
<div className="grid grid-cols-1 gap-3">

{/* Tablet: 2 columns */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

{/* Desktop: 3 columns */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
```

### **Thumb Zone Design**
```
┌─────────────────────────┐
│  HUD (Compact Top Bar)  │ ← Safe area aware
├─────────────────────────┤
│                         │
│   Canvas/Game Area      │
│   (Centered, Scaled)    │
│                         │
├─────────────────────────┤
│  [Pause] [REACT BUTTON] │ ← Bottom thumb zone
└─────────────────────────┘
         ↑ Safe area
```

---

## 🧪 Testing Checklist

### **Devices to Test:**
- [ ] iPhone SE (375×667, 320×568 landscape)
- [ ] Small Android (360×640)
- [ ] Old Android (320×480)
- [ ] iPhone 12/13 (390×844)
- [ ] Large phone (414×896)
- [ ] iPad Mini (768×1024)
- [ ] Desktop (1280×720+)

### **Performance Checks:**
- [ ] Smooth animations on low-end devices
- [ ] No horizontal scroll at 320px
- [ ] Buttons accessible in thumb zones
- [ ] Text readable without zoom
- [ ] No layout shift on load
- [ ] Safe areas respected (notch, home indicator)

### **Accessibility:**
- [ ] Focus states visible
- [ ] ARIA labels on buttons
- [ ] Keyboard navigation works
- [ ] Reduce motion respected
- [ ] Color-blind friendly (shapes + colors)

---

## 🔧 Implementation Details

### **Key Files Modified:**

1. **`/styles/globals.css`**
   - Mobile-first base font size (14px)
   - Safe area CSS variables
   - Reduce motion support

2. **`/components/arena/HUD.tsx`**
   - Dual layout (compact mobile, full desktop)
   - Responsive avatar/score sizes
   - Progress bar for rounds

3. **`/components/arena/BottomBar.tsx`**
   - Thumb-zone button layout
   - Hidden reaction log on mobile
   - Large REACT button

4. **`/components/arena/ArenaCanvas.tsx`**
   - Responsive canvas sizing
   - Mobile-optimized dimensions
   - Reduced padding on mobile

5. **`/components/arena/HowToPlayOverlay.tsx`**
   - Bottom sheet pattern
   - Scrollable content
   - Drag handle

6. **`/components/arena/PauseMenu.tsx`**
   - Bottom sheet with timer
   - Compressed warnings
   - Large buttons

7. **`/index.html`**
   - Viewport meta with safe-area
   - PWA meta tags
   - Theme color

---

## 📊 Performance Metrics

### **Target Performance:**
- **First Paint**: < 1.5s
- **Interactive**: < 3.0s
- **Canvas FPS**: 60fps (30fps acceptable on old devices)
- **Animation**: Smooth at 60fps or instant (reduced motion)

### **Bundle Size:**
- Keep JavaScript minimal
- Use code splitting for screens
- Lazy load non-critical components

---

## 🎯 Best Practices

### **DO:**
✅ Use `min-h-[44px]` for all tap targets
✅ Test on real devices (especially 320px width)
✅ Provide visual feedback on tap (`active:scale-95`)
✅ Use safe area CSS variables
✅ Hide decorative elements on mobile
✅ Reduce blur/shadow on mobile
✅ Use bottom sheets for modals
✅ Keep thumb zone for primary actions

### **DON'T:**
❌ Use fixed pixel sizes without responsive variants
❌ Add heavy blurs on mobile
❌ Assume hover states (mobile is tap-only)
❌ Stack too many layers (z-index hell)
❌ Use tiny text (< 12px)
❌ Ignore safe areas (notch/home indicator)
❌ Add unnecessary animations
❌ Block with full-screen modals unnecessarily

---

## 🚀 Future Optimizations

### **Phase 2 (Optional):**
1. **Image optimization**: WebP with fallbacks
2. **Font subsetting**: Load only needed characters
3. **Service worker**: Offline support
4. **Lazy loading**: Code split by route
5. **Virtual scrolling**: For long lists
6. **Web Workers**: Offload calculations
7. **IndexedDB**: Local game state cache

### **PWA Features:**
- Add to home screen
- Offline play (practice mode)
- Push notifications (match invites)
- Background sync (scores)

---

## 📝 Notes

- All components use mobile-first Tailwind classes
- Effects scale up with screen size, not down
- Performance is prioritized over visual flourishes on mobile
- Accessibility features work across all breakpoints
- Safe areas are respected on all modern devices

**Last Updated**: 2024
**Version**: 1.0.0