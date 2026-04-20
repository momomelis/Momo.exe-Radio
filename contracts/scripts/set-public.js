/**
 * Phase 4 — PUBLIC MINT
 * Advances the contract from PRESALE → PUBLIC.
 *
 *   CONTRACT_ADDRESS=0x...
 *   npx hardhat run scripts/set-public.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS env var is required");

  const [signer] = await ethers.getSigners();
  const contract  = await ethers.getContractAt("MomoCandieNFT", address, signer);

  const current = await contract.currentPhase();
  if (current !== 1n) throw new Error(`Expected PRESALE phase (1), got ${current}`);

  const [totalMinted, maxSupply] = await Promise.all([
    contract.totalMinted(),
    contract.MAX_SUPPLY(),
  ]);
  console.log(`Minted so far : ${totalMinted} / ${maxSupply}`);
  console.log("Advancing to PUBLIC MINT...");

  const tx = await contract.setPhase(2); // Phase.PUBLIC
  await tx.wait();
  console.log("setPhase(PUBLIC) tx:", tx.hash);
  console.log("\nPublic mint is now LIVE.");
}

main().catch((err) => { console.error(err); process.exit(1); });
