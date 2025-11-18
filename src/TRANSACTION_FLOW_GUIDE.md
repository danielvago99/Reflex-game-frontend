# 🔐 Solana Transaction Signing UI Flow

## Overview

This document describes the comprehensive Web3 transaction signing flow for the Reflex Game platform. The system handles both **player-signed transactions** (normal stakes) and **auto-approved transactions** (DAO treasury-funded free stakes).

---

## 💰 Stake Amounts

### Regular Stakes (Require Signature)
All regular match stakes require player signature and transaction on Solana:
- **◎ 0.05 SOL** - Small stake
- **◎ 0.1 SOL** - Medium stake  
- **◎ 0.2 SOL** - Large stake

### Free Stakes (DAO Treasury)
When a player has **Free Stakes** available (earned through daily challenges or ambassador rewards):
- ✅ **No signature required** - Auto-approved by DAO treasury
- ✅ **No SOL cost** - Funded by DAO community fund
- ✅ **Full winnings kept** - Players keep 100% of winnings from free stake matches
- ⚡ **Instant approval** - Auto-proceeds to match in 2 seconds

**How it works:** If a player has free stakes in their Rewards Center, they can choose to use one instead of paying SOL. The transaction bypasses the signature flow entirely and is immediately approved by the DAO treasury smart contract.

---

## 🎯 Flow States

### 1️⃣ Transaction Review Modal
**Purpose:** Initial review before signing

**Features:**
- Transaction summary display
  - Stake amount in SOL (◎)
  - Estimated network fee
  - Recipient address (Game Contract / DAO)
  - Total cost calculation
- Clear messaging: "Please sign this transaction to confirm your stake."
- Action buttons:
  - **Sign Transaction** (highlighted, gradient button)
  - **Cancel** (subtle background)

**Visual Design:**
- Glassmorphism modal with angled corners
- Shield icon representing security
- Gradient borders (from #00FFA3 to #06B6D4)
- Corner accent lines
- Background blur with glow effects

---

### 2️⃣ Transaction Signing Animation
**Purpose:** Waiting for wallet signature

**Visual Elements:**
- Rotating rings around shield icon
- Multiple animated layers:
  - Outer ring (slower, reverse direction)
  - Inner ring (faster, primary color)
  - Center pulsing shield icon
- Solana Network indicator badge

**Messages:**
- "Waiting for Signature"
- "Please confirm the transaction in your wallet"

**Behavior:**
- Close button hidden during signing
- Automatic progression to broadcasting state
- Toast notification: "Signature requested"

---

### 3️⃣ Transaction Broadcasting
**Purpose:** Sending to Solana network

**Visual Elements:**
- Holographic cube/lightning animation
- Pulsing concentric circles
- Progress indicator bar (70% width)
- Rotating gradient effect

**Messages:**
- "Broadcasting Transaction"
- "Sending to Solana network..."

**Behavior:**
- Toast notification: "Transaction broadcasting"
- Auto-advances to success or error state
- Simulated network delay (2 seconds)

---

### 4️⃣ Transaction Success Screen
**Purpose:** Confirmation and details

**Visual Elements:**
- Large checkmark icon with pulse animation
- Green glow effects (#00FFA3)
- Transaction summary card
- Transaction ID display with copy button
- Explorer link button

**Features:**
- **Amount Staked** display
- **Transaction ID** (truncated, with copy functionality)
- **View on Solscan** link (opens in new tab)
- **Continue to Game** button

**Messages:**
- "Transaction Successful!"
- "Your stake has been confirmed"

**Behavior:**
- Toast notification: "Transaction confirmed"
- Calls `onConfirm()` callback
- Explorer link: `https://solscan.io/tx/{txId}`

---

### 5️⃣ Transaction Error State
**Purpose:** Handle failures gracefully

**Visual Elements:**
- Red alert circle icon with pulse
- Error message display
- Common issues list
- Retry and Cancel buttons

**Error Messages:**
- "Transaction failed. Insufficient funds or network error."
- Common issues breakdown:
  - Insufficient SOL balance
  - Transaction rejected by user
  - Network congestion

**Actions:**
- **Cancel** - Close modal
- **Try Again** - Return to review state

---

### 6️⃣ Free Stake Mode (DAO Funded)
**Purpose:** Auto-approved transactions from DAO treasury

**Visual Elements:**
- Glowing vault icon (purple #7C3AED)
- Sparkle effects around vault
- Pulsing concentric circles
- Auto-proceeding dots indicator

**Messages:**
- "DAO Treasury Stake"
- "This match is funded by the DAO treasury"
- "No signature required" (highlighted in green)

**Behavior:**
- **Skips signature step entirely**
- Auto-proceeds after 2 seconds
- Toast notification: "Free stake activated - Funded by DAO treasury"
- Immediately calls `onConfirm()` callback

**Info Box:**
- "Free stakes are covered by the DAO community fund. Your winnings are yours to keep!"

---

## 🎨 Design System

### Color Palette
```css
Background: #0B0F1A → #1a0f2e (gradient)
Primary (Success): #00FFA3
Secondary (Info): #06B6D4
Accent (DAO): #7C3AED
Error: #ef4444 (red-500)
```

### Typography
- Headers: Orbitron / Rajdhani (futuristic)
- Body: Inter (geometric, clean)
- Sizes: Consistent with existing theme

### Glassmorphism
- `backdrop-blur-lg`
- `bg-white/5` overlays
- `border border-white/10`
- Gradient borders and glows

### Animations
- **Rotation:** Spinning rings, cubes
- **Pulse:** Breathing glows, icons
- **Ping:** Expanding circles
- **Bounce:** Loading dots
- **Fade-in:** Modal entrance

---

## 🔧 Component API

### TransactionModal Props

```typescript
interface TransactionModalProps {
  isOpen: boolean;              // Modal visibility
  onClose: () => void;          // Close handler
  onConfirm: () => void;        // Success callback
  stakeAmount: number;          // SOL amount
  isFreeStake?: boolean;        // DAO funded flag
  transactionType?: 'stake' | 'claim' | 'withdrawal';
  estimatedFee?: number;        // Network fee (default: 0.000005)
}
```

### Usage Example

```tsx
import { TransactionModal } from './components/TransactionModal';

function MyComponent() {
  const [showTx, setShowTx] = useState(false);

  const handleStake = () => {
    setShowTx(true);
  };

  return (
    <TransactionModal
      isOpen={showTx}
      onClose={() => setShowTx(false)}
      onConfirm={() => {
        // Handle successful transaction
        console.log('Transaction confirmed!');
        setShowTx(false);
      }}
      stakeAmount={0.1}
      isFreeStake={false}
      transactionType="stake"
    />
  );
}
```

---

## 🧪 Testing the Flow

### Access Transaction Demo
1. Navigate to Dashboard
2. Click **"Transaction Flow Demo"** button (purple dev tools)
3. Choose from test scenarios:
   - **Small Stake (◎ 0.05 SOL)** - Regular signing flow
   - **Medium Stake (◎ 0.1 SOL)** - Regular signing flow
   - **Large Stake (◎ 0.2 SOL)** - Regular signing flow
   - **Free Stake (DAO Treasury)** - Auto-approved, no signature

### Test States
Each test includes:
- Visual state progression
- Toast notifications
- Success/Error handling (90% success rate simulation)
- Real-time state updates

### Regular Stake Flow
All regular stakes (0.05, 0.1, 0.2 SOL) follow the complete signing flow:
1. Review transaction details
2. Sign with wallet
3. Broadcast to Solana network
4. Success confirmation with TX ID

### Free Stake Flow
When using a free stake from rewards:
1. DAO Treasury screen appears
2. Auto-proceeds after 2 seconds
3. No signature required
4. Immediately starts match

---

## 📊 State Machine

```
┌─────────────┐
│   Review    │ ──Cancel──> [Close]
└─────────────┘
      │
   Sign Tx
      ▼
┌─────────────┐
│   Signing   │
└─────────────┘
      │
  Signature
      ▼
┌─────────────┐
│Broadcasting │
└─────────────┘
      │
    Network
    ┌─┴─┐
    ▼   ▼
┌───────┐  ┌───────┐
│Success│  │ Error │
└───────┘  └───────┘
    │         │
Continue   Retry
```

### Free Stake Flow

```
┌─────────────┐
│ DAO Funded  │ ──Auto (2s)──> [Confirm]
└─────────────┘
```

---

## 🚀 Integration Points

### Game Lobby Integration
```tsx
// When user selects stake amount
<TransactionModal
  isOpen={showTransaction}
  onClose={() => setShowTransaction(false)}
  onConfirm={() => {
    // Start game with confirmed stake
    startGame();
  }}
  stakeAmount={selectedStake}
  isFreeStake={hasFreeeStake && usingFreeStake}
/>
```

### Rewards Redemption
```tsx
// When claiming rewards
<TransactionModal
  isOpen={showClaim}
  onClose={() => setShowClaim(false)}
  onConfirm={() => {
    // Update balance
    updateWalletBalance();
  }}
  stakeAmount={claimAmount}
  transactionType="claim"
/>
```

---

## 🔔 Toast Notifications

### Notification Flow
1. **Review** → (no toast)
2. **Signing** → "Signature requested - Please check your wallet"
3. **Broadcasting** → "Transaction broadcasting - Sending to Solana network..."
4. **Success** → "Transaction confirmed - Stake is now active"
5. **Error** → "Transaction failed - Please try again"
6. **DAO Funded** → "Free stake activated - Funded by DAO treasury"

---

## 🎯 UX Considerations

### User Guidance
- ✅ Clear messaging at each step
- ✅ Visual feedback for all interactions
- ✅ Progress indication during waiting states
- ✅ Error recovery with retry option
- ✅ Transaction ID for verification
- ✅ Explorer link for blockchain confirmation

### Accessibility
- Close button available in stable states
- Keyboard navigation support
- Clear visual hierarchy
- High contrast colors
- Icon + text labels

### Performance
- Smooth animations (GPU-accelerated)
- Optimized re-renders
- State management via React hooks
- Automatic cleanup on unmount

---

## 🔐 Security Features

### Wallet Integration
- Non-custodial design
- User controls private keys
- Clear transaction details before signing
- No hidden fees or recipients

### DAO Treasury
- Transparent funding source
- No signature required for free stakes
- Clear messaging about fund origin
- User owns all winnings

### Transaction Verification
- Transaction ID provided
- Solscan explorer link
- Copy functionality for ID
- Full transparency

---

## 📝 Notes

### Mock Transaction IDs
The demo generates 64-character mock transaction IDs for testing. In production, these will be real Solana transaction signatures.

### Success/Error Simulation
Currently simulates 90% success rate and 10% error rate for testing purposes. Production will use actual blockchain results.

### Network Fees
Default estimated fee: 0.000005 SOL (5,000 lamports)
This is typical for Solana transactions but may vary based on network conditions.

---

## 🎨 Screenshots Reference

### Transaction Review
- Glassmorphism modal with angled corners
- Shield icon with gradient
- Transaction details cards
- Sign + Cancel buttons

### Signing Animation
- Rotating double-ring animation
- Pulsing shield center
- Solana network badge
- "Waiting for Signature" text

### Success State
- Large green checkmark with glow
- Transaction summary
- Copy TX ID button
- Solscan explorer link

### DAO Funded
- Purple vault icon with sparkles
- Glowing circular animation
- Auto-proceed indicator
- "No signature required" message

---

## 🛠️ Future Enhancements

- [ ] Real Phantom/Solflare wallet integration
- [ ] Actual Solana transaction signing
- [ ] Real-time fee estimation from network
- [ ] Transaction history tracking
- [ ] Multi-signature support
- [ ] Hardware wallet support
- [ ] Custom RPC endpoint selection
- [ ] Transaction priority fees

---

Built with ❤️ for the Reflex Game platform