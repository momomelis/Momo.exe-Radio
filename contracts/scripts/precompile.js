"use strict";
/**
 * precompile.js
 *
 * Compiles MomoCandieNFT.sol using the npm `solc` package (no network
 * required) and writes a Hardhat-format artifact to the path that
 * `ethers.getContractFactory()` expects.
 *
 * Output: artifacts/contracts/MomoCandieNFT.sol/MomoCandieNFT.json
 *
 * Run before any `hardhat run --no-compile` script:
 *   node scripts/precompile.js
 */

const solc = require("solc");
const fs   = require("fs");
const path = require("path");

// ── Paths ──────────────────────────────────────────────────────────
const PROJECT_ROOT      = path.resolve(__dirname, "..");
const CONTRACTS_DIR     = path.join(PROJECT_ROOT, "contracts");
const NODE_MODULES      = path.join(PROJECT_ROOT, "node_modules");
const ARTIFACT_DIR      = path.join(PROJECT_ROOT, "artifacts", "contracts", "MomoCandieNFT.sol");
const ARTIFACT_PATH     = path.join(ARTIFACT_DIR, "MomoCandieNFT.json");

const ENTRY_SOURCE_NAME = "contracts/MomoCandieNFT.sol";
const CONTRACT_NAME     = "MomoCandieNFT";

// ── Import resolver ────────────────────────────────────────────────
function sourceNameToAbsPath(sourceName) {
  if (sourceName.startsWith("contracts/")) {
    return path.join(PROJECT_ROOT, sourceName);
  }
  // Library import (@openzeppelin/..., etc.) — resolve from node_modules
  return path.join(NODE_MODULES, sourceName);
}

function resolveImport(fromSourceName, importStr) {
  if (importStr.startsWith("./") || importStr.startsWith("../")) {
    const fromDir  = path.posix.dirname(fromSourceName.replace(/\\/g, "/"));
    return path.posix.normalize(fromDir + "/" + importStr);
  }
  return importStr;
}

// ── Recursive source collector ─────────────────────────────────────
const IMPORT_RE = /^\s*import\s+(?:[^"']*\s+)?["']([^"']+)["']/gm;

function collectSources(sourceName, sources, visited) {
  if (visited.has(sourceName)) return;
  visited.add(sourceName);

  const absPath = sourceNameToAbsPath(sourceName);
  const content = fs.readFileSync(absPath, "utf8");
  sources[sourceName] = { content };

  IMPORT_RE.lastIndex = 0;
  let match;
  while ((match = IMPORT_RE.exec(content)) !== null) {
    collectSources(resolveImport(sourceName, match[1]), sources, visited);
  }
}

// ── Main ───────────────────────────────────────────────────────────
function main() {
  console.log("Collecting sources...");
  const sources = {};
  const visited = new Set();
  collectSources(ENTRY_SOURCE_NAME, sources, visited);
  console.log(`Loaded ${Object.keys(sources).length} source files`);

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        [ENTRY_SOURCE_NAME]: {
          [CONTRACT_NAME]: ["abi", "evm.bytecode", "evm.deployedBytecode"],
        },
      },
    },
  };

  console.log(`Compiling with solc ${solc.version()}...`);
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors   = (output.errors || []).filter((e) => e.severity === "error");
  const warnings = (output.errors || []).filter((e) => e.severity === "warning");
  warnings.forEach((w) => console.warn("WARN:", w.formattedMessage));
  if (errors.length) {
    errors.forEach((e) => console.error("ERROR:", e.formattedMessage));
    process.exit(1);
  }

  const contractOut = output.contracts?.[ENTRY_SOURCE_NAME]?.[CONTRACT_NAME];
  if (!contractOut) {
    console.error(`No output for ${CONTRACT_NAME} — check source name`);
    process.exit(1);
  }

  const evmBC  = contractOut.evm?.bytecode;
  const evmDBC = contractOut.evm?.deployedBytecode;
  const prefix = (s) => (s.startsWith("0x") ? s : "0x" + s);

  const artifact = {
    _format:                "hh-sol-artifact-1",
    contractName:           CONTRACT_NAME,
    sourceName:             ENTRY_SOURCE_NAME,
    abi:                    contractOut.abi,
    bytecode:               prefix(evmBC?.object  ?? ""),
    deployedBytecode:       prefix(evmDBC?.object ?? ""),
    linkReferences:         evmBC?.linkReferences  ?? {},
    deployedLinkReferences: evmDBC?.linkReferences ?? {},
  };

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(artifact, null, 2));

  console.log("Artifact →", ARTIFACT_PATH);
  console.log("ABI entries  :", artifact.abi.length);
  console.log("Bytecode size:", (artifact.bytecode.length - 2) / 2, "bytes");
}

main();
