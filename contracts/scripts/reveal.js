/**
 * Phase 6 — REVEAL
 * Uploads the base URI to the contract, flipping all tokens from the
 * unrevealed placeholder to their final metadata.
 *
 *   CONTRACT_ADDRESS=0x...
 *   BASE_URI=ipfs://QmYourFolderCID/   (trailing slash required)
 *   npx hardhat run scripts/reveal.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  const baseURI  = process.env.BASE_URI;

  if (!address) throw new Error("CONTRACT_ADDRESS env var is required");
  if (!baseURI)  throw new Error("BASE_URI env var is required");
  if (!baseURI.endsWith("/")) throw new Error("BASE_URI must end with a trailing slash");

  const [signer] = await ethers.getSigners();
  const contract  = await ethers.getContractAt("MomoCandieNFT", address, signer);

  const phase    = await contract.currentPhase();
  const revealed = await contract.revealed();

  if (phase !== 3n)  throw new Error(`Expected CLOSED phase (3), got ${phase}`);
  if (revealed)       throw new Error("Contract is already revealed");

  const totalMinted = await contract.totalMinted();
  console.log(`Total minted     : ${totalMinted}`);
  console.log(`Setting base URI : ${baseURI}`);

  const tx = await contract.reveal(baseURI);
  await tx.wait();
  console.log("reveal() tx:", tx.hash);

  // Smoke-test: fetch token 1 URI
  try {
    const uri = await contract.tokenURI(1n);
    console.log("Token #1 URI    :", uri);
  } catch {
    console.warn("Could not fetch tokenURI(1) — check token exists");
  }

  console.log("\nCollection is now REVEALED.");
}

main().catch((err) => { console.error(err); process.exit(1); });
