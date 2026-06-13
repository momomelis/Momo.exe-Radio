# CLAUDE.md — Momo.exe-Radio / Momo Candie DAO

This file provides context for AI assistants working in this codebase.

---

## Project Overview

**Momo Candie DAO — The Council Chamber** is a cyberpunk-feminist Web3 governance
interface for the Momo Candie NFT collection. It is a React 19 single-page
application that visualises DAO proposals, voting power, collection statistics,
live on-chain treasury balances, a 4-agent AI analysis layer, and an admin panel
for managing the NFT contract lifecycle.

The project has three distinct layers:

| Layer | Status |
|---|---|
| **Frontend** (React SPA) | Mostly mocked; live treasury balance fetch implemented |
| **Backend** (Express + Claude AI agents) | Implemented; requires `ANTHROPIC_API_KEY` |
| **Smart contract** (Solidity + Hardhat) | Written and deployable; not yet deployed to mainnet |

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| UI framework | React | 19.2 |
| Bundler | Vite | 7.3 |
| Language | JavaScript (JSX) | ES2020 |
| Styling | CSS-in-JS (template literals) | — |
| Web3 library | ethers.js | 6.x |
| AI SDK | @anthropic-ai/sdk | 0.78+ |
| Backend framework | Express | 5.x |
| Smart contracts | Solidity 0.8.24 + Hardhat | 2.22 |
| OpenZeppelin | ERC721, Ownable, MerkleProof | 5.x |
| Linting | ESLint (flat config) | 9.39 |
| Package manager | npm | (package-lock.json present) |

No TypeScript, no CSS modules, no routing library, no state management library,
no test framework (frontend). Contracts have `hardhat test` available.

---

## Repository Layout

```
Momo.exe-Radio/
├── index.html                  HTML shell
├── vite.config.js              Minimal Vite config (@vitejs/plugin-react)
├── eslint.config.js            ESLint 9 flat config
├── package.json                Root — frontend + backend dependencies
├── .env.example                Required env vars (copy to .env)
│
├── src/                        React frontend
│   ├── main.jsx                Entry point — mounts <App /> into #root
│   ├── App.jsx                 Thin wrapper — renders <MomoCandieDAO />
│   ├── App.css                 (exists but App.jsx does not import it)
│   ├── MomoCandieDAO.jsx       Main application (~1050 lines)
│   ├── AiAgentOracle.jsx       AI Agents tab — streams from /api/analyze
│   ├── AdminPanel.jsx          Admin tab — live ethers.js contract control
│   ├── index.css               Global resets / base styles
│   └── assets/react.svg
│
├── server/                     Node.js backend (Express + Claude)
│   ├── index.js                SSE server on port 3001; exposes /api/analyze
│   └── agents.js               4 Claude Opus 4.6 agents (tool-use + streaming)
│
├── contracts/                  Solidity smart contract + Hardhat scripts
│   ├── package.json            Separate package (Hardhat, OZ, merkletreejs)
│   ├── hardhat.config.js       Solidity 0.8.24, sepolia + mainnet networks
│   ├── contracts/
│   │   └── MomoCandieNFT.sol   ERC-721 with phased minting + DAO handoff
│   └── scripts/
│       ├── deploy.js           Deploy with UNREVEALED_URI
│       ├── verify.js           Etherscan source verification
│       ├── set-presale.js      Generate Merkle tree + open presale phase
│       ├── set-public.js       Advance PRESALE → PUBLIC
│       ├── reserve-mint.js     Mint reserve + close sale
│       ├── reveal.js           Set BASE_URI + flip revealed flag
│       └── dao-handoff.js      Transfer ownership to DAO multisig
│
└── .github/
    └── workflows/
        └── nft-pipeline.yml    7-phase manual-approval deployment pipeline
```

---

## Architecture

### Component tree

```
App
└── MomoCandieDAO              (main state — tabs, wallet connection, tick timer)
    ├── GlitchTitle            (animated neon title banner)
    ├── StatsBar               (collection-wide statistics strip — mock data)
    ├── WalletPanel            (Web3 connect UI — mocked; shows PowerRing + traits)
    │   └── PowerRing          (SVG voting-power donut chart)
    ├── ProposalCard           (one card per proposal; local vote state)
    ├── OraclePanel            (mock keyword-based terminal — static responses)
    ├── CouncilBalances        (live Etherscan fetch — real ETH balances)
    ├── AiAgentOracle          (AI Agents tab — EventSource → /api/analyze)
    └── AdminPanel             (ethers.js contract admin — real write txns)
```

### Tab navigation (7 tabs)

| Tab id | Label | Component | Data |
|---|---|---|---|
| `proposals` | Proposals | `ProposalCard` ×3 | Mock |
| `wallet` | My Seat | `WalletPanel` | Mock |
| `oracle` | Oracle | `OraclePanel` | Mock keyword responses |
| `stats` | Collection | inline stats grid | Mock |
| `treasury` | Treasury | `CouncilBalances` | **Live** — Etherscan API |
| `agents` | AI Agents | `AiAgentOracle` | **Live** — Claude Opus via server |
| `admin` | Admin | `AdminPanel` | **Live** — ethers.js + MetaMask |

### State management

- All state is local React (`useState`, `useRef`, `useEffect`).
- No external store (no Redux, Zustand, Context API).
- `MomoCandieDAO` owns top-level state: active tab, wallet connection, 30-second tick.
- `ProposalCard` owns vote UI state (selected choice, voted flag).
- `CouncilBalances` self-manages fetch lifecycle (loading, error, lastFetch).
- `AdminPanel` self-manages provider/signer/contract/state.
- `AiAgentOracle` self-manages per-agent streaming state via an `EventSource`.

### Styling convention

All styles are inline JavaScript objects or template-literal `<style>` blocks.
There are **no external CSS files beyond `index.css`**.

The global `css` template literal at the top of `MomoCandieDAO.jsx` is injected
via `<style>{css}</style>` and defines all shared CSS classes (`.panel`,
`.btn-primary`, `.nav-item`, `.mono`, `.orb`, animations, etc.).

The design system is the `COLORS` constant in `MomoCandieDAO.jsx`:

```js
const COLORS = {
  void:     "#050508",   // deepest background
  deep:     "#0a0a14",
  panel:    "#0d0d1a",
  border:   "#1a1a2e",
  pink:     "#ff0077",   // primary accent
  pinkDim:  "#cc0055",   // dimmed pink (borders, scrollbar)
  cyan:     "#00f5ff",   // secondary accent
  cyanDim:  "#00b8bf",   // dimmed cyan
  acid:     "#b8ff00",   // tertiary accent
  acidDim:  "#8acc00",   // dimmed acid
  cream:    "#f0e6d3",   // body text
  muted:    "#5a5a7a",
  ghost:    "#2a2a3e",
};
```

`AdminPanel.jsx` and `AiAgentOracle.jsx` duplicate these tokens into a local
`const C = { ... }` object to stay self-contained. Keep the two sets in sync
if adding new tokens.

Always use `COLORS.*` / `C.*` — never hardcode hex values.

### Fonts

Loaded at the top of `MomoCandieDAO.jsx` via `@import url(...)`:
- **Share Tech Mono** — monospace body / data (`.mono`)
- **Orbitron** — display headings (`.orb`)
- **Exo 2** — UI labels (body default)

---

## Server Layer (`server/`)

The backend is a standalone Express server (`npm run server`) that runs on port
3001, separate from the Vite dev server.

### `/api/analyze` (GET, SSE)

Orchestrates four Claude Opus 4.6 agents **sequentially**. Each agent streams
text tokens back to the client as Server-Sent Events before the next agent
starts.

**Event shape:**

```js
{ type: "agent_start", agent: "data" | "risk" | "timing" | "synthesis" }
{ type: "token",       agent: <same>, text: <string> }
{ type: "agent_done",  agent: <same>, output: <full text> }
{ type: "done" }
{ type: "error",       message: <string> }
```

### Agent pipeline (`server/agents.js`)

Each agent is a streaming agentic loop (`runAgent`) that:
1. Calls `client.messages.stream()` with `thinking: { type: "adaptive" }`.
2. Forwards `text` delta events to the SSE client via `onToken`.
3. On `tool_use` stop reason, executes all tool calls in parallel server-side,
   then loops with a `tool_result` user message.
4. Terminates on `end_turn` or after 6 iterations.

| Agent | Tools | Data source |
|---|---|---|
| **Data** | `fetch_defi_yields`, `fetch_protocol_tvl` | DefiLlama API (live) |
| **Risk** | `calculate_impermanent_loss`, `assess_jlp_risk` | Computed locally |
| **Timing** | `get_lunar_phase`, `get_technical_signals` | Computed locally (lunar math + deterministic RSI mock) |
| **Synthesis** | _(no tools)_ | Aggregates previous agents' outputs |

The Data agent is the only one making real external HTTP calls. The Risk and
Timing agents use pure computation / deterministic mocks.

### `/api/health` (GET)

Returns `{ ok: true }` — useful for liveness checks.

---

## Smart Contract (`contracts/`)

`contracts/contracts/MomoCandieNFT.sol` — ERC-721 with:

- **Supply:** 5,250 tokens (token IDs 1–5,250)
- **Reserve:** 250 cap (`RESERVE_LIMIT`), mintable by owner in any phase
- **Pricing:** 0.055 ETH presale / 0.075 ETH public
- **Per-wallet limits:** 2 presale / 5 public; 5 per tx
- **Phase enum:** `PAUSED → PRESALE → PUBLIC → CLOSED` (sequential only)
- **Merkle allowlist:** double-keccak leaf (`keccak256(abi.encode(address))`)
- **Metadata:** unrevealed URI until `reveal()` sets IPFS base URI
- **DAO handoff:** `daoHandoff(address)` transfers Ownable ownership to multisig
  (only after `reveal()`)

### Contract deployment lifecycle

```
Deploy → Verify (Etherscan) → Set Merkle Root + Open Presale
       → Open Public Mint → Reserve Mint → Close Sale
       → Reveal (set IPFS base URI) → DAO Handoff
```

Each step maps to a Hardhat script in `contracts/scripts/` and a GitHub Actions
job in `.github/workflows/nft-pipeline.yml`.

### Hardhat commands (run from `contracts/`)

```bash
cd contracts
npm install           # install Hardhat + OZ
npm run compile       # compile contracts
npm test              # run Hardhat test suite
npm run deploy:sepolia  # deploy to Sepolia testnet
```

---

## CI/CD Pipeline (`.github/workflows/nft-pipeline.yml`)

Manually triggered (`workflow_dispatch`) with two inputs: `network` (sepolia /
mainnet) and `start_phase` (to resume a partial run).

Seven sequential jobs, each guarded by a GitHub Environment requiring manual
reviewer approval:

| Job | Environment | What it does |
|---|---|---|
| 1. Deploy | `deploy-mainnet` | `scripts/deploy.js` → outputs `contract_address` |
| 2. Verify | `verify` | `scripts/verify.js` → Etherscan source verify |
| 3. Presale | `presale` | Generates Merkle tree; `set-presale.js` |
| 4. Public Mint | `public-mint` | `set-public.js` |
| 5. Reserve Mint | `reserve-mint` | `reserve-mint.js` (also closes sale) |
| 6. Reveal | `reveal` | `reveal.js` — **irreversible** |
| 7. DAO Handoff | `dao-handoff` | `dao-handoff.js` — **irreversible** |

Required GitHub Secrets: `DEPLOYER_PRIVATE_KEY`, `RPC_URL_MAINNET`,
`RPC_URL_SEPOLIA`, `ETHERSCAN_API_KEY`, `UNREVEALED_URI`, `BASE_URI`,
`RESERVE_RECIPIENT`, `DAO_ADDRESS`.

---

## Environment Variables

Copy `.env.example` to `.env` in the repo root before running locally.

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_ETHERSCAN_API_KEY` | Frontend (Vite) | Treasury tab live balance fetch |
| `ANTHROPIC_API_KEY` | Server (`server/index.js`) | Claude agent calls — **keep secret** |
| `VITE_CONTRACT_ADDRESS` | Frontend (Vite) | Pre-fills Admin panel address field |

Vite exposes `VITE_*` variables to the browser via `import.meta.env.*`.
Non-`VITE_` variables are server-only and never bundled into the frontend.

---

## Development Commands

### Frontend + Backend

```bash
npm install           # install all frontend + backend deps
npm run dev           # start Vite dev server on :5173 (HMR enabled)
npm run server        # start agent API server on :3001
npm run build         # production build → dist/
npm run preview       # serve production build locally
npm run lint          # ESLint check
```

The `AI Agents` tab requires **both** `npm run dev` and `npm run server` running
concurrently. The frontend connects to `http://localhost:3001/api/analyze` via
EventSource (proxied through Vite's dev server if a proxy is configured, or
direct if CORS allows).

### Contracts

```bash
cd contracts
npm install
npm run compile
npm test
npm run deploy:sepolia
```

---

## Mock Data (replace before going live)

All mock constants live at the top of `MomoCandieDAO.jsx`, clearly marked with
`// ── Mock Data (replace with live API calls) ─────────────────────`.

| Constant | Purpose |
|---|---|
| `MOCK_WALLET` | Abbreviated Ethereum address |
| `MOCK_POWER` | Voting power (√-dampened) |
| `MOCK_TOKENS` | NFTs held |
| `MOCK_RANK` | Council rank |
| `MOCK_PROPOSALS` | Array of governance proposals |
| `MOCK_TRAITS` | NFT trait rarity + score breakdown |
| `MOCK_STATS` | Collection-wide aggregate stats |

`COUNCIL_ADDRESSES` at the top of `MomoCandieDAO.jsx` is a real list of 3
Ethereum addresses used for the live treasury balance fetch in `CouncilBalances`.

### Proposal schema

```js
{
  id:      string,      // IPFS-style short hash, e.g. "QmXv7k2"
  title:   string,
  body:    string,
  choices: string[],    // vote option labels
  scores:  number[],    // vote percentages (must sum to 100)
  state:   "active" | "closed",
  ends:    number,      // Unix timestamp (ms)
  votes:   number,      // total vote count
  quorum:  number,      // quorum threshold (%)
}
```

---

## ESLint Rules

- Flat config (`eslint.config.js`), ESLint 9 format.
- `no-unused-vars` is set to warn but **allows variables matching `/^[A-Z_]/`**
  (i.e. capitalised constants used as component names or design tokens are
  intentionally exempt).
- React hooks rules enforced via `eslint-plugin-react-hooks`.
- `dist/` is excluded from linting.

---

## Web3 Integration — Status

| Feature | Status | Notes |
|---|---|---|
| Treasury ETH balances | **Live** | `CouncilBalances` → Etherscan `balancemulti` API |
| AI agent analysis | **Live** | `server/agents.js` → Claude Opus 4.6 + DefiLlama |
| Admin panel write txns | **Live** | `AdminPanel.jsx` → ethers.js BrowserProvider |
| Wallet connection | Mock | `setConnected(true)` toggle — no real provider |
| Proposal voting | Mock | Local state update only |
| Oracle terminal | Mock | Keyword-matched static responses |
| Collection stats | Mock | Hardcoded `MOCK_STATS` |
| Smart contract | Written | Not deployed to mainnet |

### Voting power model

Voting power uses **square-root (√) dampening** to reduce whale dominance:

```
voting_power = √(tokens_held) × trait_rarity_score
```

---

## Conventions for AI Assistants

1. **Component structure.** The main UI lives in `MomoCandieDAO.jsx`.
   `AdminPanel.jsx` and `AiAgentOracle.jsx` are imported into it. Do not
   split further unless the user explicitly requests it.

2. **No TypeScript.** Plain JSX only. Do not introduce `.ts`/`.tsx` files.

3. **CSS-in-JS only.** Do not introduce CSS modules, Tailwind, or
   styled-components. Extend the existing inline style / template-literal pattern.

4. **Use color tokens.** Reference `COLORS.*` in `MomoCandieDAO.jsx` and
   `C.*` in the other two component files. Never hardcode hex values.

5. **Keep `C` and `COLORS` in sync.** `AdminPanel` and `AiAgentOracle` each
   carry their own `const C = { ... }` copy. If you add a token to `COLORS`,
   add it to both `C` objects as well.

6. **Mock data is intentional scaffolding.** Do not remove mock constants
   without replacing with real API calls.

7. **No new dependencies without discussion.** The footprint is intentionally
   minimal. Adding libraries (beyond those already installed) requires
   deliberate decision.

8. **Server and frontend are separate processes.** The backend (`server/`) is
   a standalone Node process, not part of the Vite bundle. It uses CommonJS-style
   ESM (`"type": "module"` in root `package.json`) and runs with `node server/index.js`.

9. **Contracts are a separate npm workspace.** Always `cd contracts` before
   running Hardhat commands. Never mix root `node_modules` with contract deps.

10. **ESLint.** Run `npm run lint` after non-trivial frontend changes and fix
    errors before committing. The server and contracts directories are not linted
    by the root ESLint config.

11. **Commit messages.** Short imperative sentences (≤72 chars). No emoji.
    Example: `Add quorum progress bar to ProposalCard`.

12. **Branch naming.** Feature branches follow `claude/<short-description>-<id>`.

13. **Irreversible contract operations.** `reveal()` and `daoHandoff()` cannot
    be undone. The Admin panel marks these buttons as `danger`. Never call them
    without explicit user confirmation.

---

## Feature Status Labels

| Label | Meaning |
|---|---|
| `exploring` | Idea being considered — no commitment |
| `in design` | Decided to build it, figuring out HOW |
| `preview` | Public but no SLA; ~1–2 quarters from GA |
| `ga` | Live for everyone; SLA + support active |
| `shipped` | Closed + linked to Changelog post |

---

## Known Gaps / Future Work

- No frontend tests (unit, integration, or e2e)
- No contract tests (`hardhat test` scaffolded but no test files written)
- No CI for the frontend (lint only via local `npm run lint`)
- Wallet connection is mocked — real MetaMask / WalletConnect integration needed
- Proposal voting is local-only — no Snapshot or on-chain vote submission
- Oracle terminal uses static keyword responses — wire to Etherscan MCP or live RPC
- Collection stats (`MOCK_STATS`) are hardcoded — replace with live contract reads
- No mobile breakpoints / responsive design
- No accessibility audit (ARIA, keyboard nav, contrast ratios)
- `VITE_*` keys in `.env` are exposed to the browser — treat `VITE_ETHERSCAN_API_KEY`
  as a rate-limited public key, never put secrets in `VITE_*` variables
- `ANTHROPIC_API_KEY` must stay server-side only (`server/` process)
- README is still the default Vite template — needs replacing
- Smart contract not deployed to mainnet; `0xMOMO...CAND` is a placeholder
