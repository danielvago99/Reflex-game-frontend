# Reflex Web3 Wallet System Documentation

## Overview

This document describes the secure, non-custodial Web3 wallet creation and management system implemented in the Reflex gaming platform. The system uses industry-standard cryptographic protocols to ensure maximum security while maintaining a user-friendly experience.

## 🔐 Security Features

### Cryptographic Standards

1. **BIP-39 Mnemonic Generation**
   - 12-word seed phrases generated using the BIP-39 standard
   - Compatible with all major Solana wallets
   - Cryptographically secure random generation

2. **AES-256-GCM Encryption**
   - Seed phrases encrypted with AES-256-GCM (military-grade encryption)
   - Password-based key derivation using PBKDF2
   - 100,000 iterations for enhanced security
   - SHA-256 hashing algorithm

3. **Local-Only Storage**
   - All encryption happens client-side
   - Passwords and seed phrases never leave the device
   - No server-side storage of sensitive data

### Security Measures

- **Password Strength Validation**: Real-time password strength checking with feedback
- **3-Attempt Limit**: Wallet locks after 3 failed password attempts
- **Seed Phrase Verification**: Users must verify their seed phrase before proceeding
- **Biometric Authentication**: Optional fingerprint/Face ID support
- **Recovery Options**: Multiple wallet recovery methods (seed phrase, JSON backup)

## 📱 Wallet Creation Flow

### Step 1: Create Wallet (20% Progress)
**File**: `/components/wallet/CreateWalletScreen.tsx`

- Introduction to wallet creation
- Explanation of BIP-39 and AES-256-GCM
- Security features overview
- Local encryption guarantee

**Key Features**:
- ✅ Step progress indicator (1 of 5)
- 🔐 Security feature list
- 📚 Educational tooltips
- 🎨 Futuristic glassmorphism design

### Step 2: Set Password (40% Progress)
**File**: `/components/wallet/SetPasswordScreen.tsx`

- Password creation with confirmation
- Real-time password strength meter
- Biometric unlock option
- Seed phrase recovery acknowledgment

**Key Features**:
- ✅ Enhanced password strength indicator (Weak/Medium/Strong/Very Strong)
- 👁️ Show/hide password toggle
- 📊 Real-time strength scoring (0-100)
- 💡 Password improvement suggestions
- 🔒 AES-GCM encryption explanation

**Password Strength Scoring**:
- Length (8+ chars: +20, 12+ chars: +20, 16+ chars: +10)
- Lowercase letters: +10
- Uppercase letters: +10
- Numbers: +15
- Special characters: +15

### Step 3: Seed Phrase Display (60% Progress)
**File**: `/components/wallet/SeedDisplayScreen.tsx`

- Display of 12-word BIP-39 seed phrase
- Blur overlay with "Reveal" button
- Copy to clipboard functionality
- JSON wallet export
- Security warnings

**Key Features**:
- 🔒 Initial blur overlay for privacy
- 📋 One-click copy functionality
- 💾 Download JSON backup
- ⚠️ Critical security warnings
- ✅ Storage best practices
- 📝 Confirmation checkbox

### Step 3.5: Seed Verification (70% Progress)
**File**: `/components/wallet/SeedVerifyScreen.tsx`

- User must select 3 random words from their seed phrase
- Visual feedback for correct/incorrect selections
- Error animation on failure
- Success confirmation

**Key Features**:
- 🎯 3 random word verification
- ✅ Green highlight for correct words
- ❌ Red highlight for incorrect words
- 🔄 Shuffled word options (9 total: 3 correct + 6 decoys)
- 📊 Real-time feedback

### Step 4: Encrypting Wallet (80% Progress)
**File**: `/components/wallet/EncryptingWalletScreen.tsx`

- Animated encryption process
- Multi-stage progress indicator
- Floating hex particles animation
- Educational crypto information

**Encryption Stages**:
1. Generating encryption keys... (800ms)
2. Encrypting seed phrase with AES-256-GCM... (1200ms)
3. Securing wallet locally... (800ms)
4. Finalizing... (600ms)

**Key Features**:
- ⏱️ Realistic encryption simulation
- 🎨 3D rotating shield animation
- 🔑 Orbiting key icons
- 📊 Real-time progress bar (0-100%)
- 💫 Floating hexagon particles
- 🎯 Stage-by-stage checklist

### Step 5: Wallet Ready (100% Progress)
**File**: `/components/wallet/WalletReadyScreen.tsx`

- Display Solana address (base58 encoded)
- QR code for address
- Network selection (Devnet/Mainnet)
- Funding instructions
- Balance check option

**Key Features**:
- ✅ Success animation (bouncing checkmark)
- 📱 QR code generation
- 📋 Address copy functionality
- 🌐 Network selector
- 📖 Step-by-step funding guide
- 🔒 Security confirmation message

## 🔓 Wallet Unlock Flow

### Unlock Wallet Screen
**File**: `/components/wallet/UnlockWalletScreen.tsx`

**Features**:
- 🔐 Password unlock with real decryption
- 👆 Biometric authentication option
- ⚠️ 3-attempt limit with lockout
- 🔑 Recovery method options
- 📊 Attempt counter display

**Security Measures**:
- Attempts tracked in localStorage
- Real AES-GCM decryption validation
- Password locked after 3 failed attempts
- Seed phrase recovery option
- JSON import option

**Locked State**:
When locked, users can:
- Import wallet using seed phrase
- Upload JSON backup file
- Reset wallet (creates new wallet)

## 🛠️ Core Utilities

### Wallet Crypto Module
**File**: `/utils/walletCrypto.ts`

#### Key Functions

**`generateSeedPhrase(): string[]`**
- Generates a 12-word BIP-39 mnemonic
- Uses cryptographically secure randomness
- Returns array of 12 words

**`deriveSolanaKeypair(seedPhrase: string[]): Promise<Keypair>`**
- Converts BIP-39 mnemonic to Solana Keypair
- Uses proper seed derivation
- Returns Solana Keypair object

**`encryptSeedPhrase(seedPhrase: string[], password: string): Promise<string>`**
- Encrypts seed phrase with AES-256-GCM
- Uses PBKDF2 for key derivation (100k iterations)
- Returns base64-encoded encrypted data
- Random IV for each encryption

**`decryptSeedPhrase(encryptedData: string, password: string): Promise<string[]>`**
- Decrypts AES-GCM encrypted seed phrase
- Validates password correctness
- Throws error on wrong password
- Returns original seed phrase array

**`getPasswordStrength(password: string)`**
- Calculates password strength (0-100)
- Provides level (weak/medium/strong/very-strong)
- Returns improvement suggestions

**Storage Functions**:
- `storeEncryptedWallet()` - Saves to localStorage
- `getEncryptedWallet()` - Retrieves from localStorage
- `hasWallet()` - Checks if wallet exists
- `deleteWallet()` - Removes wallet data
- `getUnlockAttempts()` - Gets failed attempts
- `incrementUnlockAttempts()` - Tracks failures
- `resetUnlockAttempts()` - Clears on success

## 🎨 Design System

### Visual Elements

**Color Palette**:
- Primary: `#00FFA3` (Neon Green)
- Secondary: `#06B6D4` (Cyan)
- Accent: `#7C3AED` (Purple)
- Background: `#0B0F1A` → `#101522` → `#1a0f2e` (Gradient)

**Effects**:
- Glassmorphism panels (`backdrop-blur-lg`)
- Neon glow animations
- Gradient borders with blur
- Floating particle animations
- Rotating shield/lock icons
- Shimmer effects on progress bars

**Typography**:
- Headers: Orbitron (futuristic)
- Body: Rajdhani (clean, modern)

### Components

**WalletButton**:
- Primary and secondary variants
- Icon support
- Disabled states
- Gradient backgrounds

**WalletInput**:
- Labeled input fields
- Error states
- Password visibility toggle
- Icon support

**WalletAlert**:
- Info, Warning, Success, Danger variants
- Icon-based differentiation
- Glassmorphic design
- Optional titles

**WalletCard**:
- Glassmorphic container
- Gradient borders
- Responsive padding

## 📊 Data Flow

### Wallet Creation Flow

```
1. User clicks "Create Wallet"
   ↓
2. App generates BIP-39 seed phrase (12 words)
   ↓
3. User sets password
   ↓
4. Seed phrase displayed (with reveal/copy)
   ↓
5. User verifies 3 random words
   ↓
6. Encrypting animation plays
   ↓
7. Seed encrypted with AES-256-GCM
   ↓
8. Solana keypair derived from seed
   ↓
9. Encrypted wallet stored in localStorage
   ↓
10. User shown Solana address + QR
   ↓
11. Balance check → Dashboard
```

### Wallet Unlock Flow

```
1. User enters password
   ↓
2. Encrypted wallet retrieved from localStorage
   ↓
3. Decrypt seed phrase with password
   ↓
4. Success? → Dashboard
   ↓
5. Failure? → Increment attempts
   ↓
6. 3 failures? → Lock wallet
   ↓
7. Locked? → Recovery options
```

## 🔒 Security Best Practices

### For Users

1. **Password**:
   - Use strong, unique password (12+ characters)
   - Mix uppercase, lowercase, numbers, symbols
   - Don't share or reuse

2. **Seed Phrase**:
   - Write down on paper immediately
   - Store in multiple secure locations
   - Never share with anyone
   - Don't screenshot or save digitally
   - Don't store in cloud services

3. **Account Security**:
   - Enable biometric unlock if available
   - Download JSON backup
   - Test recovery before depositing large amounts

### For Developers

1. **Cryptography**:
   - Use standard libraries (bip39, @solana/web3.js)
   - Never implement custom crypto
   - Always use secure random generation

2. **Storage**:
   - Only store encrypted data
   - Never log sensitive information
   - Clear sensitive data from memory

3. **Validation**:
   - Validate all user inputs
   - Implement rate limiting
   - Add attempt limits

## 📦 Dependencies

```json
{
  "bip39": "^3.x.x",
  "@solana/web3.js": "^1.x.x",
  "bs58": "^5.x.x"
}
```

## 🚀 Future Enhancements

Potential improvements for future versions:

1. **Multi-Chain Support**: Extend to Ethereum, Polygon, etc.
2. **Hardware Wallet Integration**: Ledger/Trezor support
3. **Social Recovery**: Multi-sig recovery options
4. **Encrypted Cloud Backup**: Optional encrypted cloud storage
5. **Transaction Signing**: Full transaction management
6. **Token Management**: SPL token support
7. **NFT Display**: Show NFT holdings
8. **Contact Book**: Save frequent recipients

## 📝 Notes

- All encryption is performed client-side
- No data is sent to external servers
- Compatible with other Solana wallets (same seed phrase works)
- Suitable for real-world use with proper security awareness
- Educational tooltips explain technical concepts

## ⚠️ Disclaimer

This wallet system is designed for the Reflex gaming platform. While it implements industry-standard security measures, users should:

- Only deposit amounts they can afford to lose
- Understand this is NOT meant for storing large amounts
- Take full responsibility for their seed phrase security
- Verify all transactions before signing
- Keep software updated

**The developers cannot recover lost passwords or seed phrases.**

---

Built with ❤️ for the Reflex Web3 Gaming Platform
