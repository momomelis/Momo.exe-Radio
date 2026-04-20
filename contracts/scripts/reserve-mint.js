/**
 * Phase 5 — RESERVE MINT
 * Mints reserved tokens to the treasury / team wallet.
 * Closes the sale (PUBLIC → CLOSED) after minting.
 *
 *   CONTRACT_ADDRESS=0x...
 *   RESERVE_RECIPIENT=0x...   (treasury / Gnosis Safe address)
 *   RESERVE_QUANTITY=250
 *   npx hardhat run scripts/reserve-mint.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const address   = process.env.CONTRACT_ADDRESS;
  const recipient = process.env.RESERVE_RECIPIENT;
  const quantity  = Number(process.env.RESERVE_QUANTITY || "250");

  if (!address)   throw new Error("CONTRACT_ADDRESS env var is required");
  if (!recipient) throw new Error("RESERVE_RECIPIENT env var is required");

  const [signer] = await ethers.getSigners();
  const contract  = await ethers.getContractAt("MomoCandieNFT", address, signer);

  const alreadyReserved = await contract.reserveMinted();
  const reserveLimit    = await contract.RESERVE_LIMIT();
  console.log(`Reserve minted : ${alreadyReserved} / ${reserveLimit}`);

  if (alreadyReserved + BigInt(quantity) > reserveLimit) {
    throw new Error(`Quantity ${quantity} would exceed reserve limit ${reserveLimit}`);
  }

  console.log(`Minting ${quantity} reserve tokens → ${recipient} ...`);

  // Mint in batches of 5 to stay within gas limits
  const BATCH = 5;
  let remaining = quantity;
  while (remaining > 0) {
    const batch = Math.min(remaining, BATCH);
    const tx = await contract.reserveMint(recipient, batch);
    await tx.wait();
    remaining -= batch;
    console.log(`  ✓ minted ${batch} — ${remaining} remaining (tx: ${tx.hash})`);
  }

  // Close the sale
  const current = await contract.currentPhase();
  if (current === 2n) {
    console.log("\nClosing sale (PUBLIC → CLOSED)...");
    const tx = await contract.setPhase(3); // Phase.CLOSED
    await tx.wait();
    console.log("setPhase(CLOSED) tx:", tx.hash);
  }

  const finalMinted = await contract.totalMinted();
  console.log(`\nReserve mint complete. Total minted: ${finalMinted}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
