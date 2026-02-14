import {
  AnchorProvider,
  BN,
  Program,
  type Idl,
  type Wallet as AnchorWallet,
} from '@coral-xyz/anchor';
import { type ReactNode, createContext, useContext, useMemo } from 'react';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import idl from '../../../idl/reflex_pvp_escrow.json';
import { ENV } from '../../../config/env';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';

const CONFIG_SEED = Buffer.from('config');
const VAULT_SEED = Buffer.from('vault');

interface SolanaProgramContextValue {
  program: Program<Idl> | null;
  programId: PublicKey;
  deriveConfigPda: () => PublicKey;
  deriveVaultPda: (matchPubkey: PublicKey) => PublicKey;
  createMatch: (input: {
    gameMatch: Keypair;
    stakeLamports: number | bigint;
    joinExpirySeconds: number;
  }) => Promise<string>;
  joinMatch: (input: { gameMatch: PublicKey; settleDeadlineSeconds: number }) => Promise<string>;
}

const programId = new PublicKey(ENV.SOLANA_PROGRAM_ID);

const SolanaProgramContext = createContext<SolanaProgramContextValue | null>(null);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { anchorWallet, publicKey } = useUnifiedWallet();

  const provider = useMemo(() => {
    if (!anchorWallet) return null;

    return new AnchorProvider(connection, anchorWallet as AnchorWallet, {
      commitment: 'confirmed',
    });
  }, [anchorWallet, connection]);

  const program = useMemo(() => {
    if (!provider) return null;

    return new Program({ ...(idl as Idl), address: programId.toBase58() }, provider);
  }, [provider]);

  const value = useMemo<SolanaProgramContextValue>(
    () => ({
      program,
      programId,
      deriveConfigPda: () => PublicKey.findProgramAddressSync([CONFIG_SEED], programId)[0],
      deriveVaultPda: (matchPubkey: PublicKey) =>
        PublicKey.findProgramAddressSync([VAULT_SEED, matchPubkey.toBuffer()], programId)[0],
      createMatch: async ({ gameMatch, stakeLamports, joinExpirySeconds }) => {
        if (!program || !publicKey) {
          throw new Error('Wallet is not connected');
        }

        const config = PublicKey.findProgramAddressSync([CONFIG_SEED], programId)[0];
        const vault = PublicKey.findProgramAddressSync([VAULT_SEED, gameMatch.publicKey.toBuffer()], programId)[0];

        return program.methods
          .createMatch(new BN(stakeLamports.toString()), new BN(joinExpirySeconds))
          .accounts({
            playerA: publicKey,
            config,
            gameMatch: gameMatch.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([gameMatch])
          .rpc();
      },
      joinMatch: async ({ gameMatch, settleDeadlineSeconds }) => {
        if (!program || !publicKey) {
          throw new Error('Wallet is not connected');
        }

        const vault = PublicKey.findProgramAddressSync([VAULT_SEED, gameMatch.toBuffer()], programId)[0];

        return program.methods
          .joinMatch(new BN(settleDeadlineSeconds))
          .accounts({
            playerB: publicKey,
            gameMatch,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      },
    }),
    [program, publicKey]
  );

  return <SolanaProgramContext.Provider value={value}>{children}</SolanaProgramContext.Provider>;
}

export const useSolanaProgram = () => {
  const context = useContext(SolanaProgramContext);

  if (!context) {
    throw new Error('useSolanaProgram must be used within SolanaProvider');
  }

  return context;
};
