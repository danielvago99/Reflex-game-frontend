# Required Dependencies

## Install Required Packages

Run the following command to install all required dependencies for backend, WebSocket, and Solana integration:

```bash
npm install @solana/web3.js
```

## Optional Dependencies

For enhanced functionality, consider installing:

```bash
# For encoding/decoding
npm install bs58

# For cryptography (signing/verification)
npm install tweetnacl

# For secure password hashing (if storing passwords client-side)
npm install bcryptjs

# For encryption (seed phrase encryption)
npm install crypto-js
```

## Updated package.json

Add these to your `package.json` dependencies:

```json
{
  "dependencies": {
    "@solana/web3.js": "^1.95.0",
    "bs58": "^6.0.0",
    "tweetnacl": "^1.0.3",
    "crypto-js": "^4.2.0"
  }
}
```

## Development Dependencies

Already included in your project:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Sonner (toasts)

## Verification

After installation, verify with:

```bash
npm list @solana/web3.js
```

## Next Steps

1. Run `npm install @solana/web3.js`
2. Uncomment Solana imports in `/utils/solana.ts`
3. Set environment variables in `.env`
4. Start development server: `npm run dev`
5. Test with mock data first, then enable real integrations

## TypeScript Types

The `@solana/web3.js` package includes TypeScript definitions, so no additional @types packages are needed.

## Notes

- **@solana/web3.js**: Core library for Solana blockchain interactions
- Version ^1.95.0 is stable and well-tested
- Works in both browser and Node.js environments
- Includes all necessary types for TypeScript
