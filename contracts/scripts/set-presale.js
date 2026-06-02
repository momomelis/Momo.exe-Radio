/**
 * Phase 3 — PRESALE
 * Generates a Merkle tree from the allowlist, uploads the root on-chain,
 * then advances the contract to Phase.PRESALE.
 *
 *   CONTRACT_ADDRESS=0x...
 *   ALLOWLIST_PATH=./allowlist.json   (array of "0xAddress" strings)
 *   npx hardhat run scripts/set-presale.js --network mainnet
 */

const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");

// Leaves use double-hash (keccak256(keccak256(abi.encode(addr)))) matching OZ v5 MerkleProof standard.
function buildTree(addresses) {
  const leaves = addresses.map((addr) => {
    const inner = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [addr]));
    return Buffer.from(ethers.keccak256(inner).slice(2), "hex");
  });
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

async function main() {
  const address      = process.env.CONTRACT_ADDRESS;
  const allowlistPath = process.env.ALLOWLIST_PATH || "./allowlist.json";

  if (!address) throw new Error("CONTRACT_ADDRESS env var is required");
  if (!fs.existsSync(allowlistPath)) throw new Error(`Allowlist not found: ${allowlistPath}`);

  const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
  console.log(`Loaded ${allowlist.length} allowlisted addresses`);

  const tree = buildTree(allowlist);
  const root = tree.getHexRoot();
  console.log("Merkle root:", root);

  // Persist tree for frontend / proof generation
  fs.writeFileSync(
    "./merkle-tree.json",
    JSON.stringify({ root, leaves: allowlist }, null, 2)
  );
  console.log("Merkle tree written to ./merkle-tree.json");

  const [signer] = await ethers.getSigners();
  const contract  = await ethers.getContractAt("MomoCandieNFT", address, signer);

  console.log("\nSetting merkle root on-chain...");
  const tx1 = await contract.setMerkleRoot(root);
  await tx1.wait();
  console.log("setMerkleRoot tx:", tx1.hash);

  // Phase: PAUSED(0) → PRESALE(1)
  const current = await contract.currentPhase();
  if (current !== 0n) throw new Error(`Expected PAUSED phase, got ${current}`);

  console.log("Advancing to PRESALE...");
  const tx2 = await contract.setPhase(1); // Phase.PRESALE
  await tx2.wait();
  console.log("setPhase(PRESALE) tx:", tx2.hash);

  console.log("\nPresale is now LIVE.");
}

main().catch((err) => { console.error(err); process.exit(1); });
