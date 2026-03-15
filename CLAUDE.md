# CLAUDE.md — Momo.exe-Radio / Momo Candie DAO

This file provides context for AI assistants working in this codebase.

---

## Project Overview

**Momo Candie DAO — The Council Chamber** is a cyberpunk-feminist Web3 governance
interface for the Momo Candie NFT collection. It is a React 19 single-page
application that visualises DAO proposals, voting power, collection statistics,
and an on-chain oracle query panel.

The current state is a **frontend prototype**: all data is mocked. The project is
ready for integration with live Ethereum/Web3 APIs and smart contracts.

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

No TypeScript, no CSS modules, no routing library, no state management library,
no test framework.

---

## Repository Layout

```
Momo.exe-Radio/
├── index.html                  HTML shell — title "Momo Candie DAO — Council Chamber"
├── vite.config.js              Minimal Vite config; uses @vitejs/plugin-react (Babel)
├── eslint.config.js            ESLint 9 flat config
├── package.json
├── src/
│   ├── main.jsx                React 19 entry — mounts <App /> into #root
│   ├── App.jsx                 Thin wrapper — renders <MomoCandieDAO />
│   ├── MomoCandieDAO.jsx       Entire application (~900 lines)
│   └── index.css               Global resets / base styles
└── public/
    └── vite.svg
```

Everything of substance lives in **`src/MomoCandieDAO.jsx`**. There is no routing;
the app is a single view with tab navigation managed by `useState`.

---

## Architecture

### Component tree

```
App
└── MomoCandieDAO          (main state owner — tabs, wallet, vote state)
    ├── GlitchTitle        (animated neon title banner)
    ├── StatsBar           (collection-wide statistics strip)
    ├── WalletPanel        (Web3 connect UI — mocked)
    ├── PowerRing          (SVG voting-power donut chart)
    ├── ProposalCard       (one card per proposal; handles local vote state)
    └── OraclePanel        (mock on-chain data query terminal)
```

### State management

- All state is local React (`useState`, `useRef`, `useEffect`).
- No external store (no Redux, Zustand, Context API).
- `MomoCandieDAO` owns top-level state: active tab, wallet connection, vote
  selections.
- `ProposalCard` owns its own vote UI state (selected choice, voted flag).

### Styling convention

All styles are written as JavaScript template-literal strings assigned to
`const style = { ... }` objects or inline `style={}` props. There are **no
external CSS files beyond `index.css`**. The design system is defined at the top
of `MomoCandieDAO.jsx` in the `COLORS` constant:

```js
const COLORS = {
  void:    "#050508",   // deepest background
  deep:    "#0a0a14",
  panel:   "#0d0d1a",
  border:  "#1a1a2e",
  pink:    "#ff0077",   // primary accent
  cyan:    "#00f5ff",   // secondary accent
  acid:    "#b8ff00",   // tertiary accent
  cream:   "#f0e6d3",   // body text
  muted:   "#5a5a7a",
  ghost:   "#2a2a3e",
};
```

Always use `COLORS.*` tokens rather than hardcoded hex values.

### Fonts

Loaded at the top of `MomoCandieDAO.jsx` via `@import url(...)`:
- **Share Tech Mono** — monospace body / data
- **Orbitron** — display headings
- **Exo 2** — UI labels

---

## Mock Data (replace before going live)

All mock constants are at the top of `MomoCandieDAO.jsx`, clearly marked with
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

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (HMR enabled)
npm run build        # production build → dist/
npm run preview      # serve production build locally
npm run lint         # ESLint check
```

No test command exists yet. There is no CI/CD configuration.

---

## ESLint Rules

- Flat config (`eslint.config.js`), ESLint 9 format.
- `no-unused-vars` is set to warn but **allows variables matching `/^[A-Z_]/`**
  (i.e. capitalised constants used as component names or design tokens are
  intentionally exempt).
- React hooks rules enforced via `eslint-plugin-react-hooks`.
- `dist/` is excluded from linting.

---

## Web3 Integration (planned)

The UI is wired for these integrations — none are implemented yet:

- **Wallet providers:** MetaMask, WalletConnect, Coinbase Wallet
- **Chain:** Ethereum Mainnet (chain ID 1)
- **Smart contract address:** `0xMOMO...CAND` (placeholder)
- **Cross-chain:** Solana via Wormhole bridge (for mirror governance snapshots)
- **Data layer:** Etherscan MCP layer for on-chain queries (Oracle panel)

### Voting power model

Voting power uses **square-root (√) dampening** to reduce whale dominance:

```
voting_power = √(tokens_held) × trait_rarity_score
```

---

## Conventions for AI Assistants

1. **Single-file application.** All UI lives in `MomoCandieDAO.jsx`. Do not
   split components into separate files unless the user explicitly requests it.

2. **No TypeScript.** This is a plain JSX project. Do not introduce type
   annotations or `.ts`/`.tsx` files.

3. **CSS-in-JS only.** Do not introduce CSS modules, Tailwind, styled-components,
   or external stylesheets. Extend the existing inline style pattern.

4. **Use COLORS tokens.** Never hardcode hex values — reference `COLORS.*`.

5. **Mock data is intentional.** The mock constants are temporary scaffolding.
   Do not remove them without replacing with real API calls.

6. **No new dependencies without discussion.** The dependency footprint is
   intentionally minimal (React + Vite only). Adding libraries requires
   deliberate decision.

7. **No tests exist yet.** Do not add tests unless explicitly asked; equally,
   don't block on their absence.

8. **ESLint.** Run `npm run lint` after non-trivial changes and fix any errors
   before committing.

9. **Commit messages.** Use short imperative sentences (≤72 chars). No emoji.
   Example: `Add quorum progress bar to ProposalCard`.

10. **Branch naming.** Feature branches follow `claude/<short-description>-<id>`.

---

## Feature Status Labels

When tracking planned work, use these labels consistently:

| Label | Meaning |
|---|---|
| `exploring` | Idea being considered — no commitment |
| `in design` | Decided to build it, figuring out HOW |
| `preview` | Public but no SLA; ~1–2 quarters from GA |
| `ga` | Live for everyone; SLA + support active |
| `shipped` | Closed + linked to Changelog post |

---

## Known Gaps / Future Work

- No tests (unit, integration, or e2e)
- No CI/CD pipeline
- No environment variable management (`.env` / secrets)
- No routing (single view only)
- All data is mocked — no live Web3/API integration
- No mobile breakpoints / responsive design
- No accessibility audit (ARIA, keyboard nav, contrast)
- README is the default Vite template — needs replacing
