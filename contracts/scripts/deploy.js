/**
 * Phase 1 — DEPLOY
 * Deploys MomoCandieNFT to the target network and writes the contract
 * address to stdout so the GitHub Actions pipeline can capture it.
 *
 *   DEPLOYER_PRIVATE_KEY=0x...
 *   RPC_URL_MAINNET=https://...
 *   UNREVEALED_URI=ipfs://Qm.../unrevealed.json
 *   npx hardhat run scripts/deploy.js --network mainnet
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer  :", deployer.address);
  console.log("Balance   :", ethers.formatEther(balance), "ETH");

  const unrevealedURI = process.env.UNREVEALED_URI;
  if (!unrevealedURI) throw new Error("UNREVEALED_URI env var is required");

  console.log("\nDeploying MomoCandieNFT...");
  const Factory  = await ethers.getContractFactory("MomoCandieNFT");
  const contract = await Factory.deploy(unrevealedURI, deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\nContract deployed:", address);

  // Emit the address in a parseable format for CI
  console.log(`::set-output name=contract_address::${address}`);

  // Also persist locally for subsequent scripts
  const fs   = require("fs");
  const path = require("path");
  const out  = path.join(__dirname, "../.deployment.json");
  fs.writeFileSync(out, JSON.stringify({ address, network: hre.network.name, deployedAt: new Date().toISOString() }, null, 2));
  console.log(`Deployment info written to ${out}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
