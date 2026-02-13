import {
  AnchorProvider,
  BN,
  Program,
  type Idl,
  type Wallet as AnchorWallet,
} from '@coral-xyz/anchor';
import { type ReactNode, createContext, useContext, useMemo } from 'react';
import { Keypair, PublicKey, SystemProgram, Transaction, type VersionedTransaction } from '@solana/web3.js';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../../../idl/reflex_pvp_escrow.json';
import { ENV } from '../../../config/env';
import { useWallet } from './WalletProvider';

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
  const adapterWallet = useAnchorWallet();
  const { address, signTransaction: signInAppTransaction, signAllTransactions: signAllInAppTransactions } = useWallet();

  const wallet = useMemo<AnchorWallet | null>(() => {
    if (adapterWallet?.publicKey) {
      return adapterWallet as AnchorWallet;
    }

    if (!address) {
      return null;
    }

    const inAppPublicKey = new PublicKey(address);

    return {
      publicKey: inAppPublicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T) =>
        signInAppTransaction(transaction),
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]) =>
        signAllInAppTransactions(transactions),
    } as AnchorWallet;
  }, [adapterWallet, address, signAllInAppTransactions, signInAppTransaction]);

  const provider = useMemo(() => {
    if (!wallet) return null;

    return new AnchorProvider(connection, wallet as AnchorWallet, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

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
        if (!program || !wallet?.publicKey) {
          throw new Error('Wallet is not connected');
        }

        const config = PublicKey.findProgramAddressSync([CONFIG_SEED], programId)[0];
        const vault = PublicKey.findProgramAddressSync([VAULT_SEED, gameMatch.publicKey.toBuffer()], programId)[0];

        return program.methods
          .createMatch(new BN(stakeLamports.toString()), new BN(joinExpirySeconds))
          .accounts({
            playerA: wallet.publicKey,
            config,
            gameMatch: gameMatch.publicKey,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .signers([gameMatch])
          .rpc();
      },
      joinMatch: async ({ gameMatch, settleDeadlineSeconds }) => {
        if (!program || !wallet?.publicKey) {
          throw new Error('Wallet is not connected');
        }

        const vault = PublicKey.findProgramAddressSync([VAULT_SEED, gameMatch.toBuffer()], programId)[0];

        return program.methods
          .joinMatch(new BN(settleDeadlineSeconds))
          .accounts({
            playerB: wallet.publicKey,
            gameMatch,
            vault,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      },
    }),
    [program, wallet]
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
