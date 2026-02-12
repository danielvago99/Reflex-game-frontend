import anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
  // Anchor automatically picks up devnet and your local wallet from Anchor.toml
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync("./target/idl/reflex_pvp_escrow.json", "utf8"));
  const programId = new PublicKey("GMq3D9QQ8LxjcftXMnQUmffRoiCfczbuUoASaS7pCkp7");
  const program = new anchor.Program(idl, provider);

  // --- SET YOUR ADDRESSES HERE ---
  const serverAuthority = new PublicKey("FiWQNuWvwdo8JJvwWpsxuvwUwY2s1HcX4Y7HPBjeVwBb");
  const feeVault = new PublicKey("9NDDPtHZ3GAVgCpELygQ4ows33zEyEDpTv4jZYdaiWzs");

  console.log("Starting on-chain initialization...");

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  try {
    const tx = await program.methods
      .initializeConfig(serverAuthority)
      .accounts({
        admin: provider.wallet.publicKey,
        feeVault: feeVault,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ SUCCESS!");
    console.log("Transaction Signature:", tx);
    console.log(`Check it here: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err) {
    console.error("❌ Error during initialization:", err);
  }
}

main();