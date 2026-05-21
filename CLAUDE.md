# CLAUDE.md — Momo.exe-Radio / Momo Candie DAO

This file provides context for AI assistants working in this codebase.

---

## Project Overview

**Momo Candie DAO — The Council Chamber** is a cyberpunk-feminist Web3 governance
interface for the Momo Candie NFT collection. It is a React 19 single-page
application that visualises DAO proposals, voting power, collection statistics,
live treasury balances, an on-chain oracle query panel, a multi-agent AI
analysis layer, and an admin control panel for NFT deployment lifecycle management.

The project has moved beyond pure prototype: several features now use live APIs
and on-chain interactions, while governance data remains mocked.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| UI framework | React | 19.2 |
| Bundler | Vite | 7.3 |
| Language | JavaScript (JSX) | ES2020 |
| Styling | CSS-in-JS (template literals) | — |
| Linting | ESLint (flat config) | 9.39 |
| Package manager | npm | (package-lock.json present) |
| Web3 library | ethers.js | 6.16 |
| AI SDK | @anthropic-ai/sdk | 0.78 |
| API server | Express | 5.2 |
| Smart contracts | Hardhat + Solidity | 0.8.24 |

No TypeScript, no CSS modules, no routing library, no state management library,
no test framework (frontend). The contracts workspace has its own `package.json`
and Hardhat test suite.

---

## Repository Layout

```
Momo.exe-Radio/
├── .env.example                Required env vars — copy to .env and fill in
├── .github/
│   └── workflows/
│       └── nft-pipeline.yml    7-phase GitHub Actions deployment pipeline
├── index.html                  HTML shell — title "Momo Candie DAO — Council Chamber"
├── vite.config.js              Minimal Vite config; uses @vitejs/plugin-react (Babel)
├── eslint.config.js            ESLint 9 flat config
├── package.json                Frontend + server deps
├── src/
│   ├── main.jsx                React 19 entry — mounts <App /> into #root
│   ├── App.jsx                 Thin wrapper — renders <MomoCandieDAO />
│   ├── App.css                 App-level styles (minimal)
│   ├── MomoCandieDAO.jsx       Core application (~1050 lines); imports two sub-components
│   ├── AiAgentOracle.jsx       AI Agent Layer UI (self-contained component file)
│   ├── AdminPanel.jsx          NFT Admin Control Panel (self-contained component file)
│   └── index.css               Global resets / base styles
├── server/
│   ├── index.js                Express SSE server — GET /api/analyze
│   └── agents.js               Four Claude Opus 4.6 agents (data, risk, timing, synthesis)
├── contracts/                  Separate npm workspace — Hardhat project
│   ├── package.json
│   ├── hardhat.config.js
│   ├── contracts/
│   │   └── MomoCandieNFT.sol   ERC-721 contract (OpenZeppelin 5, Solidity 0.8.24)
│   └── scripts/
│       ├── deploy.js
│       ├── verify.js
│       ├── set-presale.js      Generates Merkle tree + sets root
│       ├── set-public.js
│       ├── reserve-mint.js
│       ├── reveal.js
│       └── dao-handoff.js
└── public/
    └── vite.svg
```

The core React application lives in `src/MomoCandieDAO.jsx` which imports
`AiAgentOracle` and `AdminPanel` from their own files. The backend agent server
is a completely separate Node.js process (`server/`). The contracts workspace is
also a standalone package under `contracts/`.

---

## Architecture

### Component tree

```
App
└── MomoCandieDAO          (main state owner — tabs, wallet, vote state)
    ├── GlitchTitle        (animated neon title banner)
    ├── StatsBar           (collection-wide statistics strip — mocked)
    ├── WalletPanel        (Web3 connect UI — mocked; shows PowerRing + trait analysis)
    │   └── PowerRing      (SVG voting-power donut chart)
    ├── ProposalCard       (one card per proposal; handles local vote state — mocked)
    ├── OraclePanel        (mock on-chain data query terminal — simulated responses)
    ├── CouncilBalances    (live ETH balance fetch via Etherscan API)
    ├── AiAgentOracle      (imported from AiAgentOracle.jsx — SSE streaming AI agents)
    └── AdminPanel         (imported from AdminPanel.jsx — live ethers.js contract mgmt)
```

### Navigation tabs (in order)

| Tab ID | Label | Component | Live data? |
|---|---|---|---|
| `proposals` | Proposals | `ProposalCard` list | No — mocked |
| `wallet` | My Seat | `WalletPanel` | No — mocked |
| `oracle` | Oracle | `OraclePanel` | No — simulated |
| `stats` | Collection | inline stats grid | No — mocked |
| `treasury` | Treasury | `CouncilBalances` | **Yes** — Etherscan API |
| `agents` | AI Agents | `AiAgentOracle` | **Yes** — Claude API via server |
| `admin` | Admin | `AdminPanel` | **Yes** — MetaMask + ethers.js |

### State management

- All state is local React (`useState`, `useRef`, `useEffect`).
- No external store (Redux, Zustand, Context API).
- `MomoCandieDAO` owns top-level state: active tab, wallet connection.
- `ProposalCard` owns its own vote UI state (selected choice, voted flag).
- `CouncilBalances` fetches on mount and exposes a refresh button.
- `AiAgentOracle` manages per-agent streaming state and an EventSource ref.
- `AdminPanel` manages ethers.js provider/signer/contract state and form inputs.

### Styling convention

All styles are written as JavaScript template-literal strings assigned to inline
`style={}` props. There are **no external CSS files beyond `index.css`** and
`App.css`. The design system is defined at the top of `MomoCandieDAO.jsx` in the
`COLORS` constant:

```js
const COLORS = {
  void:     "#050508",   // deepest background
  deep:     "#0a0a14",
  panel:    "#0d0d1a",
  border:   "#1a1a2e",
  pink:     "#ff0077",   // primary accent
  pinkDim:  "#cc0055",   // dimmed pink (hover states, borders)
  cyan:     "#00f5ff",   // secondary accent
  cyanDim:  "#00b8bf",   // dimmed cyan
  acid:     "#b8ff00",   // tertiary accent
  acidDim:  "#8acc00",   // dimmed acid
  cream:    "#f0e6d3",   // body text
  muted:    "#5a5a7a",
  ghost:    "#2a2a3e",
};
```

`AiAgentOracle.jsx` and `AdminPanel.jsx` each declare a local `const C = {...}`
that mirrors these tokens. This is intentional — it keeps those files self-contained.
Do not import `COLORS` from `MomoCandieDAO.jsx` into other files; copy the tokens
into the local `C` constant instead.

Always use `COLORS.*` / `C.*` tokens rather than hardcoded hex values.

### Fonts

Loaded at the top of `MomoCandieDAO.jsx` via `@import url(...)`:
- **Share Tech Mono** — monospace body / data
- **Orbitron** — display headings
- **Exo 2** — UI labels

These are also referenced by class names (`mono`, `orb`) and inline
`fontFamily` strings in `AiAgentOracle.jsx` and `AdminPanel.jsx`.

---

## AI Agent Layer

`server/agents.js` implements four sequential Claude Opus 4.6 agents that
collaborate to produce DeFi investment recommendations for the DAO treasury:

| Agent | Role | Data source |
|---|---|---|
| `data` | Fetches live APY / TVL | DefiLlama API (tool call) |
| `risk` | IL, drawdown, protocol risk | Receives data agent output |
| `timing` | Lunar phase + RSI/MACD signals | Computed lunar phase (local) |
| `synthesis` | Weighted allocation + confidence score | All three agent outputs |

Each agent runs as a streaming loop using `client.messages.stream` with
`thinking: { type: "adaptive" }`. Tokens are forwarded to the React frontend
via Server-Sent Events (SSE) at `GET /api/analyze`.

`server/index.js` is an Express 5 server on port 3001 (default). Start it
separately with `npm run server`. Vite proxies `/api` to `localhost:3001` — check
`vite.config.js` if that proxy config is missing.

**`ANTHROPIC_API_KEY` must be set in `.env`** for the agent server to work.
If the key is missing the server returns a 500 before opening the SSE stream.

---

## AdminPanel — NFT Contract Management

`src/AdminPanel.jsx` provides a live admin UI for the MomoCandieNFT contract
deployment lifecycle. It uses `ethers.js` v6 with a MetaMask `BrowserProvider`.

### Contract ABI (subset)

Only the functions the admin panel calls are included in the component's inline
ABI. Write actions are gated on `state.isOwner` (signer address matches
`contract.owner()`).

### Mint phases (0–3)

```
0 PAUSED  →  1 PRESALE  →  2 PUBLIC  →  3 CLOSED
```

Each phase transition is a separate `ActionRow`. After CLOSED, the
collect → reveal → DAO handoff flow is presented conditionally.

### Environment variable

`VITE_CONTRACT_ADDRESS` pre-populates the contract address input field.

---

## Smart Contracts (contracts/ workspace)

A standalone Hardhat workspace lives under `contracts/`. It has its own
`package.json` and must be installed separately:

```bash
cd contracts && npm install
```

### Contract

`contracts/contracts/MomoCandieNFT.sol` — ERC-721, Solidity 0.8.24, OpenZeppelin 5.
Key features: merkle-root presale allowlist, square-root voting power, reserve
mint, unrevealed/revealed metadata, DAO handoff (ownership transfer).

### Deployment scripts

Each script reads config from environment variables (see `contracts/hardhat.config.js`):

| Script | Purpose |
|---|---|
| `deploy.js` | Deploy contract + write `.deployment.json` |
| `verify.js` | Verify source on Etherscan |
| `set-presale.js` | Generate Merkle tree from `allowlist.json` + set root |
| `set-public.js` | Advance to PUBLIC phase |
| `reserve-mint.js` | Mint reserved tokens to treasury |
| `reveal.js` | Set base URI + flip revealed flag |
| `dao-handoff.js` | Transfer ownership to DAO multisig |

### Contracts workspace commands

```bash
cd contracts
npm run compile          # hardhat compile
npm run test             # hardhat test
npm run deploy:sepolia   # deploy to Sepolia testnet
npm run deploy           # deploy to Ethereum mainnet
npm run verify           # Etherscan verification
npm run set-presale      # open presale
npm run set-public       # open public mint
npm run reserve-mint     # treasury mint
npm run reveal           # reveal collection
npm run dao-handoff      # hand off to DAO multisig
```

---

## CI/CD Pipeline

`.github/workflows/nft-pipeline.yml` is a 7-phase GitHub Actions workflow
triggered manually via `workflow_dispatch`. Each phase is a separate job gated
behind a named GitHub Environment (requiring manual approval from reviewers).

| Job | Phase | Environment gate |
|---|---|---|
| `deploy` | Deploy contract | `deploy-mainnet` |
| `verify` | Etherscan verification | `verify` |
| `presale` | Open presale + upload Merkle tree | `presale` |
| `public-mint` | Open public mint | `public-mint` |
| `reserve-mint` | Reserve mint + close sale | `reserve-mint` |
| `reveal` | Reveal collection | `reveal` |
| `dao-handoff` | Transfer to DAO multisig | `dao-handoff` |

Required GitHub Secrets: `DEPLOYER_PRIVATE_KEY`, `RPC_URL_MAINNET`,
`RPC_URL_SEPOLIA`, `ETHERSCAN_API_KEY`, `UNREVEALED_URI`, `BASE_URI`,
`RESERVE_RECIPIENT`, `DAO_ADDRESS`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values before running locally.
**Never commit `.env`.**

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_ETHERSCAN_API_KEY` | Frontend (Vite) | Live ETH balance fetch in CouncilBalances |
| `ANTHROPIC_API_KEY` | `server/index.js` | Claude API calls in agent layer |
| `VITE_CONTRACT_ADDRESS` | Frontend (Vite) | Pre-fills contract address in AdminPanel |

Contracts workspace env vars (set in shell or `.env` inside `contracts/`):

| Variable | Purpose |
|---|---|
| `RPC_URL_SEPOLIA` | Sepolia RPC endpoint |
| `RPC_URL_MAINNET` | Mainnet RPC endpoint |
| `DEPLOYER_PRIVATE_KEY` | EOA deployer key (`0x...`) |
| `ETHERSCAN_API_KEY` | Source verification |
| `CONTRACT_ADDRESS` | Used by post-deploy scripts |

---

## Mock Data (replace before going live)

Governance data constants are at the top of `MomoCandieDAO.jsx`, marked with
`// ── Mock Data (replace with live API calls) ─────────────────────`.

| Constant | Purpose | Status |
|---|---|---|
| `MOCK_WALLET` | Abbreviated Ethereum address | Mocked |
| `MOCK_POWER` | Voting power (√-dampened) | Mocked |
| `MOCK_TOKENS` | NFTs held | Mocked |
| `MOCK_RANK` | Council rank | Mocked |
| `MOCK_PROPOSALS` | Array of governance proposals | Mocked |
| `MOCK_TRAITS` | NFT trait rarity + score breakdown | Mocked |
| `MOCK_STATS` | Collection-wide aggregate stats | Mocked |
| `COUNCIL_ADDRESSES` | Treasury wallet addresses to track | Hardcoded — update before launch |

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

## Development Commands

### Frontend + agent server

```bash
npm install          # install frontend + server dependencies
npm run dev          # start Vite dev server (HMR enabled) — http://localhost:5173
npm run server       # start Express agent server — http://localhost:3001
npm run build        # production build → dist/
npm run preview      # serve production build locally
npm run lint         # ESLint check
```

Run `npm run dev` and `npm run server` in separate terminals for full
functionality. The AI Agents tab will show a connection error if the server
is not running.

### Contracts workspace

```bash
cd contracts
npm install
npm run compile
npm run test
```

---

## ESLint Rules

- Flat config (`eslint.config.js`), ESLint 9 format.
- `no-unused-vars` is set to warn but **allows variables matching `/^[A-Z_]/`**
  (capitalised constants used as component names or design tokens are intentionally exempt).
- React hooks rules enforced via `eslint-plugin-react-hooks`.
- `dist/` is excluded from linting.

---

## Web3 Integration Status

| Feature | Status | Notes |
|---|---|---|
| Wallet connect (MetaMask) | Live in AdminPanel | Mocked in governance UI |
| Treasury ETH balances | **Live** | Etherscan API via `CouncilBalances` |
| Governance proposals | Mocked | Snapshot integration planned |
| Voting power calculation | Mocked | On-chain √-dampened formula defined |
| NFT contract | Deployed (Sepolia) | Hardhat workspace + CI/CD pipeline |
| AI agent analysis | **Live** | Claude Opus 4.6 via SSE server |

### Voting power model

```
voting_power = √(tokens_held) × trait_rarity_score
```

---

## Conventions for AI Assistants

1. **Multi-file components.** `AiAgentOracle.jsx` and `AdminPanel.jsx` exist as
   separate files. Do not merge them back into `MomoCandieDAO.jsx`. New components
   that are substantial (>150 lines) may be split into their own files; smaller
   additions should stay in `MomoCandieDAO.jsx`.

2. **No TypeScript.** Plain JSX throughout. Do not introduce `.ts`/`.tsx` files
   or type annotations in the frontend or server.

3. **CSS-in-JS only.** Do not introduce CSS modules, Tailwind, styled-components,
   or external stylesheets. Extend the existing inline style pattern.

4. **Use design tokens.** In `MomoCandieDAO.jsx` use `COLORS.*`. In
   `AiAgentOracle.jsx` and `AdminPanel.jsx` use the local `C.*` constant.
   Never hardcode hex values. When creating a new component file, copy the
   full token map into a local `const C = {...}`.

5. **Mock data is intentional.** Governance mock constants are temporary
   scaffolding. Do not remove them without replacing with real API calls.

6. **No new frontend dependencies without discussion.** The frontend footprint
   is intentionally minimal. Adding libraries requires deliberate decision.
   The server already has `express`, `cors`, and `@anthropic-ai/sdk`. The
   frontend already has `ethers`.

7. **No tests exist yet (frontend).** Do not add frontend tests unless explicitly
   asked. The contracts workspace has a Hardhat test suite — run it with
   `cd contracts && npm run test`.

8. **ESLint.** Run `npm run lint` after non-trivial changes and fix any errors
   before committing.

9. **Commit messages.** Use short imperative sentences (≤72 chars). No emoji.
   Example: `Add quorum progress bar to ProposalCard`.

10. **Branch naming.** Feature branches follow `claude/<short-description>-<id>`.

11. **Two runtimes.** The frontend (Vite) and the agent server (Express) are
    separate processes. Changes to `server/` require restarting `npm run server`;
    they do not trigger Vite HMR.

12. **ethers.js v6.** `AdminPanel.jsx` uses `ethers.BrowserProvider` and
    `ethers.Contract` (v6 API). Do not use v5 patterns (`new ethers.providers.*`).

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
- Governance data is still fully mocked — no live Snapshot / on-chain voting
- Wallet connect in the governance UI is mocked (AdminPanel is live, but the
  voting flow uses `MOCK_WALLET` / `MOCK_POWER`)
- No mobile breakpoints / responsive design
- No accessibility audit (ARIA, keyboard nav, contrast)
- README is the default Vite template — needs replacing
- `COUNCIL_ADDRESSES` in `MomoCandieDAO.jsx` is hardcoded — should come from
  contract or config
- Agent server has no authentication — `/api/analyze` is open to any caller
- No environment variable validation at startup (server silently fails if
  `ANTHROPIC_API_KEY` is missing until a request arrives)
- Design tokens are duplicated across three files (`COLORS`, `C` in
  AiAgentOracle, `C` in AdminPanel) — acceptable for now but worth consolidating
  if more component files are added
