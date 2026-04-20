/**
 * Phase 7 — DAO HANDOFF
 * Transfers contract ownership to the Gnosis Safe multisig (the DAO).
 * This is a one-way, irreversible action — the deployer wallet loses all
 * owner privileges once complete.
 *
 *   CONTRACT_ADDRESS=0x...
 *   DAO_ADDRESS=0x...   (Gnosis Safe / Squads multisig)
 *   npx hardhat run scripts/dao-handoff.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const address    = process.env.CONTRACT_ADDRESS;
  const daoAddress = process.env.DAO_ADDRESS;

  if (!address)    throw new Error("CONTRACT_ADDRESS env var is required");
  if (!daoAddress) throw new Error("DAO_ADDRESS env var is required");

  const [signer] = await ethers.getSigners();
  const contract  = await ethers.getContractAt("MomoCandieNFT", address, signer);

  const currentOwner = await contract.owner();
  const revealed     = await contract.revealed();

  console.log("Current owner  :", currentOwner);
  console.log("Signer         :", signer.address);
  console.log("DAO target     :", daoAddress);
  console.log("Revealed       :", revealed);

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not the contract owner");
  }
  if (!revealed) {
    throw new Error("Collection must be revealed before DAO handoff");
  }

  // Final confirmation guard — require explicit env flag in CI
  if (process.env.CONFIRM_HANDOFF !== "yes") {
    throw new Error(
      'Set CONFIRM_HANDOFF=yes to proceed. This action is irreversible.'
    );
  }

  console.log("\nExecuting daoHandoff()...");
  const tx = await contract.daoHandoff(daoAddress);
  await tx.wait();
  console.log("daoHandoff() tx:", tx.hash);

  const newOwner = await contract.owner();
  console.log("\nNew owner      :", newOwner);
  console.log("DAO handoff complete. The DAO now controls the contract.");
}

main().catch((err) => { console.error(err); process.exit(1); });
