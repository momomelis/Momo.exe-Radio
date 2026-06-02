/**
 * test-pipeline.js
 *
 * End-to-end smoke test of the full MomoCandieNFT lifecycle on the
 * in-process Hardhat network.  Covers every phase and every contract
 * function used by the deployment scripts.
 *
 * Run:
 *   npx hardhat run --no-compile scripts/test-pipeline.js --network hardhat
 *
 * Exits 0 on success, 1 on any failure.
 */

const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// ── Helpers ────────────────────────────────────────────────────────
let step = 0;
function log(msg)  { console.log(`  [${++step}] ${msg}`); }
function pass(msg) { console.log(`      ✓ ${msg}`); }
function fail(msg) { console.error(`      ✗ FAIL: ${msg}`); process.exit(1); }

function eq(label, got, want) {
  if (String(got) !== String(want)) fail(`${label}: got ${got}, want ${want}`);
  pass(`${label} == ${want}`);
}

// Builds a Merkle tree and returns { tree, root, proofFor(addr) }
// Leaves use double-hash (keccak256(keccak256(abi.encode(addr)))) matching OZ v5 MerkleProof standard.
function buildTree(addresses) {
  const leaves = addresses.map(addr => {
    const inner = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [addr]));
    return Buffer.from(ethers.keccak256(inner).slice(2), "hex");
  });
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return {
    root:     tree.getHexRoot(),
    proofFor: (addr) => {
      const inner = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [addr]));
      const leaf  = Buffer.from(ethers.keccak256(inner).slice(2), "hex");
      return tree.getHexProof(leaf);
    },
  };
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  MomoCandieNFT — Full Pipeline Smoke Test");
  console.log("══════════════════════════════════════════════════\n");

  const signers = await ethers.getSigners();
  const [owner, presaleMinter, publicMinter, treasury, dao] = signers;

  console.log("Accounts:");
  console.log("  owner          :", owner.address);
  console.log("  presaleMinter  :", presaleMinter.address);
  console.log("  publicMinter   :", publicMinter.address);
  console.log("  treasury       :", treasury.address);
  console.log("  dao            :", dao.address);
  console.log();

  // ── PHASE 1: Deploy ─────────────────────────────────────────────
  console.log("── Phase 1: Deploy ──────────────────────────────");
  log("Deploying MomoCandieNFT...");
  const Factory  = await ethers.getContractFactory("MomoCandieNFT");
  const contract = await Factory.deploy(
    "ipfs://QmUnrevealedCID/unrevealed.json",
    owner.address
  );
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  pass(`deployed at ${addr}`);

  eq("currentPhase", await contract.currentPhase(), 0); // PAUSED
  eq("totalMinted",  await contract.totalMinted(),  0);
  eq("revealed",     await contract.revealed(),     false);
  eq("owner",        await contract.owner(),        owner.address);
  console.log();

  // ── PHASE 2: Set Merkle root + open presale ──────────────────────
  console.log("── Phase 2: Presale ─────────────────────────────");
  const allowlist = [presaleMinter.address, signers[5].address];
  const { root, proofFor } = buildTree(allowlist);
  log("Setting merkle root...");
  await (await contract.setMerkleRoot(root)).wait();
  pass(`root set: ${root.slice(0, 14)}…`);

  log("Advancing PAUSED → PRESALE...");
  await (await contract.setPhase(1)).wait();
  eq("currentPhase", await contract.currentPhase(), 1);
  console.log();

  // ── PHASE 3: Presale mint ────────────────────────────────────────
  console.log("── Phase 3: Presale Mint ─────────────────────────");
  const presalePrice = await contract.presalePrice();
  log(`Minting 2 tokens (presale price: ${ethers.formatEther(presalePrice)} ETH each)...`);
  const proof = proofFor(presaleMinter.address);
  await (await contract.connect(presaleMinter).mintPresale(2, proof, {
    value: presalePrice * 2n,
  })).wait();
  eq("totalMinted after presale", await contract.totalMinted(), 2);
  eq("presaleMinted[presaleMinter]", await contract.presaleMinted(presaleMinter.address), 2);

  log("Verifying invalid proof is rejected...");
  try {
    await contract.connect(publicMinter).mintPresale(1, proof, { value: presalePrice });
    fail("Should have reverted with invalid proof");
  } catch (e) {
    if (e.message.includes("Invalid merkle proof")) pass("invalid proof rejected");
    else fail(`Unexpected error: ${e.message}`);
  }

  log("Verifying wallet limit is enforced...");
  try {
    await contract.connect(presaleMinter).mintPresale(1, proof, { value: presalePrice });
    fail("Should have reverted — wallet limit exceeded");
  } catch (e) {
    if (e.message.includes("Presale wallet limit exceeded")) pass("wallet limit enforced");
    else fail(`Unexpected error: ${e.message}`);
  }
  console.log();

  // ── PHASE 4: Open public mint ────────────────────────────────────
  console.log("── Phase 4: Public Mint ──────────────────────────");
  log("Advancing PRESALE → PUBLIC...");
  await (await contract.setPhase(2)).wait();
  eq("currentPhase", await contract.currentPhase(), 2);

  const publicPrice = await contract.publicPrice();
  log(`Minting 3 tokens (public price: ${ethers.formatEther(publicPrice)} ETH each)...`);
  await (await contract.connect(publicMinter).mint(3, {
    value: publicPrice * 3n,
  })).wait();
  eq("totalMinted after public", await contract.totalMinted(), 5);

  log("Verifying per-wallet public limit (5)...");
  try {
    await contract.connect(publicMinter).mint(3, { value: publicPrice * 3n });
    fail("Should have reverted — public wallet limit exceeded");
  } catch (e) {
    if (e.message.includes("Public wallet limit exceeded")) pass("public limit enforced");
    else fail(`Unexpected error: ${e.message}`);
  }
  console.log();

  // ── PHASE 5: Reserve mint + close sale ───────────────────────────
  console.log("── Phase 5: Reserve Mint ─────────────────────────");
  log("Minting 10 reserve tokens to treasury...");
  await (await contract.reserveMint(treasury.address, 10)).wait();
  eq("totalMinted after reserve", await contract.totalMinted(), 15);
  eq("reserveMinted",             await contract.reserveMinted(), 10);

  log("Advancing PUBLIC → CLOSED...");
  await (await contract.setPhase(3)).wait();
  eq("currentPhase", await contract.currentPhase(), 3);

  log("Verifying mint is blocked in CLOSED phase...");
  try {
    await contract.connect(publicMinter).mint(1, { value: publicPrice });
    fail("Should have reverted — public mint not active");
  } catch (e) {
    if (e.message.includes("Public mint not active")) pass("minting blocked after close");
    else fail(`Unexpected error: ${e.message}`);
  }
  console.log();

  // ── PHASE 6: Reveal ──────────────────────────────────────────────
  console.log("── Phase 6: Reveal ───────────────────────────────");
  const baseURI = "ipfs://QmRevealedFolderCID/";
  log(`Setting base URI: ${baseURI}`);
  await (await contract.reveal(baseURI)).wait();
  eq("revealed", await contract.revealed(), true);

  const token1URI = await contract.tokenURI(1n);
  eq("tokenURI(1)", token1URI, `${baseURI}1.json`);
  const token5URI = await contract.tokenURI(5n);
  eq("tokenURI(5)", token5URI, `${baseURI}5.json`);

  log("Verifying double-reveal is blocked...");
  try {
    await contract.reveal("ipfs://other/");
    fail("Should have reverted — already revealed");
  } catch (e) {
    if (e.message.includes("Already revealed")) pass("double-reveal blocked");
    else fail(`Unexpected error: ${e.message}`);
  }
  console.log();

  // ── PHASE 7: Withdraw ────────────────────────────────────────────
  console.log("── Phase 7: Withdraw ─────────────────────────────");
  const contractBalance = await ethers.provider.getBalance(addr);
  const expectedBalance = presalePrice * 2n + publicPrice * 3n;
  eq("contract ETH balance", contractBalance, expectedBalance);

  const treasuryBefore = await ethers.provider.getBalance(treasury.address);
  log(`Withdrawing ${ethers.formatEther(contractBalance)} ETH to treasury...`);
  await (await contract.withdraw(treasury.address)).wait();
  const treasuryAfter = await ethers.provider.getBalance(treasury.address);
  if (treasuryAfter <= treasuryBefore) fail("Treasury balance did not increase");
  pass(`treasury received ${ethers.formatEther(treasuryAfter - treasuryBefore)} ETH`);

  eq("contract ETH balance after withdraw", await ethers.provider.getBalance(addr), 0);
  console.log();

  // ── PHASE 8: DAO Handoff ─────────────────────────────────────────
  console.log("── Phase 8: DAO Handoff ──────────────────────────");
  log(`Transferring ownership to DAO: ${dao.address}`);
  await (await contract.daoHandoff(dao.address)).wait();
  eq("owner after handoff", await contract.owner(), dao.address);

  log("Verifying original owner can no longer call owner functions...");
  try {
    await contract.connect(owner).reserveMint(owner.address, 1);
    fail("Should have reverted — old owner has no access");
  } catch (e) {
    // 0x118cdaa7 = keccak256("OwnableUnauthorizedAccount(address)") selector
    if (e.message.includes("OwnableUnauthorizedAccount") ||
        e.message.includes("Ownable: caller is not the owner") ||
        e.message.includes("0x118cdaa7")) {
      pass("old owner access revoked");
    } else {
      fail(`Unexpected error: ${e.message}`);
    }
  }

  log("Verifying DAO can call owner functions...");
  await (await contract.connect(dao).reserveMint(dao.address, 1)).wait();
  pass("DAO minted successfully as new owner");
  console.log();

  // ── Summary ─────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════");
  console.log(`  ALL ${step} CHECKS PASSED`);
  console.log("══════════════════════════════════════════════════\n");
  console.log("Final state:");
  console.log("  Total minted  :", String(await contract.totalMinted()));
  console.log("  Revealed      :", await contract.revealed());
  console.log("  Owner (DAO)   :", await contract.owner());
  console.log("  Contract ETH  : 0.0 (withdrawn)");
  console.log();
}

main().catch((err) => {
  console.error("\nPIPELINE FAILED:", err.message);
  process.exit(1);
});
