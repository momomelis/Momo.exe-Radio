/**
 * Phase 2 — VERIFY
 * Submits the contract to Etherscan for source verification.
 *
 *   CONTRACT_ADDRESS=0x...
 *   ETHERSCAN_API_KEY=...
 *   UNREVEALED_URI=ipfs://Qm...
 *   npx hardhat run scripts/verify.js --network mainnet
 */

const hre = require("hardhat");

async function main() {
  const address     = process.env.CONTRACT_ADDRESS;
  const unrevealedURI = process.env.UNREVEALED_URI;

  if (!address)       throw new Error("CONTRACT_ADDRESS env var is required");
  if (!unrevealedURI) throw new Error("UNREVEALED_URI env var is required");

  const [deployer] = await hre.ethers.getSigners();

  console.log("Verifying MomoCandieNFT at:", address);
  console.log("Network                   :", hre.network.name);

  await hre.run("verify:verify", {
    address,
    constructorArguments: [unrevealedURI, deployer.address],
    contract: "contracts/MomoCandieNFT.sol:MomoCandieNFT",
  });

  console.log("\nVerification complete.");
  console.log(`https://etherscan.io/address/${address}#code`);
}

main().catch((err) => { console.error(err); process.exit(1); });
