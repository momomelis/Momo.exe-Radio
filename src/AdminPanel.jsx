import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  void:    "#050508",
  deep:    "#0a0a14",
  panel:   "#0d0d1a",
  border:  "#1a1a2e",
  pink:    "#ff0077",
  pinkDim: "#cc0055",
  cyan:    "#00f5ff",
  acid:    "#b8ff00",
  cream:   "#f0e6d3",
  muted:   "#5a5a7a",
  ghost:   "#2a2a3e",
};

// ── Minimal ABI (only functions we call from the admin panel) ────
const ABI = [
  "function currentPhase() view returns (uint8)",
  "function totalMinted() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function RESERVE_LIMIT() view returns (uint256)",
  "function reserveMinted() view returns (uint256)",
  "function revealed() view returns (bool)",
  "function owner() view returns (address)",
  "function merkleRoot() view returns (bytes32)",
  "function presalePrice() view returns (uint256)",
  "function publicPrice() view returns (uint256)",
  "function setPhase(uint8) returns ()",
  "function setMerkleRoot(bytes32) returns ()",
  "function reserveMint(address, uint256) returns ()",
  "function reveal(string) returns ()",
  "function daoHandoff(address) returns ()",
  "function withdraw(address) returns ()",
];

const PHASE_LABELS = ["PAUSED", "PRESALE", "PUBLIC", "CLOSED"];
const PHASE_COLORS = [C.muted, C.acid, C.cyan, C.pink];

// ── Helpers ────────────────────────────────────────────────────────
function truncate(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function Mono({ children, color = C.cream, size = "11px" }) {
  return (
    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: size, color }}>
      {children}
    </span>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px",
      letterSpacing: "2px", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, color = C.cream }) {
  return (
    <div style={{ padding: "12px 14px", background: C.deep, border: `1px solid ${C.ghost}` }}>
      <Label>{label}</Label>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "16px",
        fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ── Phase stepper ─────────────────────────────────────────────────
function PhaseStepper({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
      {PHASE_LABELS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        const color  = active ? PHASE_COLORS[i] : done ? C.acid : C.ghost;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {i > 0 && (
              <div style={{ flex: 1, height: "1px",
                background: done ? C.acid : C.ghost, transition: "background 0.3s" }} />
            )}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              flexShrink: 0,
            }}>
              <div style={{
                width: 24, height: 24,
                border: `1px solid ${color}`,
                background: active ? `${color}22` : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
                color: done ? C.acid : active ? color : C.muted,
                transition: "all 0.3s",
                boxShadow: active ? `0 0 12px ${color}55` : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "7px",
                letterSpacing: "1px", color: active ? color : C.muted, whiteSpace: "nowrap" }}>
                {label}
              </div>
            </div>
            {i < PHASE_LABELS.length - 1 && (
              <div style={{ flex: 1, height: "1px",
                background: done ? C.acid : C.ghost, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Action row ─────────────────────────────────────────────────────
function ActionRow({ label, description, buttonLabel, onClick, danger = false, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  async function handle() {
    setLoading(true);
    setResult(null);
    try {
      const tx = await onClick();
      if (tx?.hash) {
        setResult({ ok: true, msg: `tx: ${tx.hash.slice(0, 14)}…` });
      } else {
        setResult({ ok: true, msg: "Done" });
      }
    } catch (err) {
      setResult({ ok: false, msg: err.reason || err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "14px 16px", border: `1px solid ${C.ghost}`,
      background: C.panel, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px",
            letterSpacing: "2px", color: C.cream, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
            color: C.muted, lineHeight: 1.5 }}>
            {description}
          </div>
        </div>
        <button
          onClick={handle}
          disabled={disabled || loading}
          style={{
            background: "transparent",
            border: `1px solid ${danger ? C.pinkDim : disabled || loading ? C.ghost : C.cyan}`,
            color: disabled || loading ? C.muted : danger ? C.pink : C.cyan,
            fontFamily: "'Orbitron', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            padding: "8px 16px",
            cursor: disabled || loading ? "default" : "pointer",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          {loading ? "SENDING..." : buttonLabel}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 8, fontFamily: "'Share Tech Mono', monospace",
          fontSize: "10px", color: result.ok ? C.acid : C.pink }}>
          {result.ok ? "✓" : "✗"} {result.msg}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function AdminPanel() {
  const [provider, setProvider] = useState(null);
  const [signer,   setSigner]   = useState(null);
  const [contract, setContract] = useState(null);
  const [state,    setState]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Form state
  const [contractAddress, setContractAddress] = useState(
    import.meta.env.VITE_CONTRACT_ADDRESS || ""
  );
  const [merkleRoot,    setMerkleRoot]    = useState("");
  const [baseURI,       setBaseURI]       = useState("");
  const [reserveTo,     setReserveTo]     = useState("");
  const [reserveQty,    setReserveQty]    = useState("10");
  const [daoAddress,    setDaoAddress]    = useState("");
  const [withdrawTo,    setWithdrawTo]    = useState("");

  // ── Connect wallet ─────────────────────────────────────────────
  async function connect() {
    if (!window.ethereum) {
      setError("MetaMask not detected");
      return;
    }
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Load contract ──────────────────────────────────────────────
  async function loadContract() {
    if (!signer || !contractAddress) return;
    try {
      const c = new ethers.Contract(contractAddress, ABI, signer);
      setContract(c);
      await refresh(c);
    } catch (e) {
      setError(`Failed to load contract: ${e.message}`);
    }
  }

  async function refresh(c = contract) {
    if (!c) return;
    setLoading(true);
    try {
      const [phase, minted, remaining, reserveLimit, reserveMinted, revealed, owner, presaleP, publicP] =
        await Promise.all([
          c.currentPhase(),
          c.totalMinted(),
          c.remainingSupply(),
          c.RESERVE_LIMIT(),
          c.reserveMinted(),
          c.revealed(),
          c.owner(),
          c.presalePrice(),
          c.publicPrice(),
        ]);
      const signerAddr = await signer.getAddress();
      setState({
        phase:         Number(phase),
        minted:        Number(minted),
        remaining:     Number(remaining),
        reserveLimit:  Number(reserveLimit),
        reserveMinted: Number(reserveMinted),
        revealed,
        owner,
        signerAddr,
        isOwner:       owner.toLowerCase() === signerAddr.toLowerCase(),
        presalePrice:  ethers.formatEther(presaleP),
        publicPrice:   ethers.formatEther(publicP),
      });
      setError(null);
    } catch (e) {
      setError(`Read failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  const connected = !!signer;
  const hasContract = !!contract && !!state;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px",
          letterSpacing: "4px", color: C.pink, textShadow: `0 0 10px ${C.pink}`,
          marginBottom: 4 }}>
          ADMIN CONTROL PANEL
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px",
          color: C.muted, letterSpacing: "1px" }}>
          MomoCandieNFT · Deployment Lifecycle Management
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
          color: C.pink, padding: "10px 14px", background: "rgba(255,0,119,0.06)",
          border: `1px solid ${C.pinkDim}`, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Wallet connect */}
      {!connected && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
            color: C.muted, letterSpacing: "2px", marginBottom: 20 }}>
            Connect an owner wallet to manage the deployment
          </div>
          <button onClick={connect} style={{
            background: "transparent", border: `1px solid ${C.pink}`,
            color: C.pink, fontFamily: "'Orbitron', monospace", fontSize: "11px",
            letterSpacing: "2px", padding: "12px 28px", cursor: "pointer",
          }}>
            ◆ CONNECT WALLET
          </button>
        </div>
      )}

      {/* Contract loader */}
      {connected && !hasContract && (
        <div style={{ padding: "20px", border: `1px solid ${C.ghost}`,
          background: C.panel, marginBottom: 16 }}>
          <Label>Contract Address</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={contractAddress}
              onChange={e => setContractAddress(e.target.value)}
              placeholder="0x..."
              style={{ flex: 1, background: C.deep, border: `1px solid ${C.ghost}`,
                color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                fontSize: "12px", padding: "8px 12px", outline: "none" }}
            />
            <button onClick={loadContract} style={{
              background: "transparent", border: `1px solid ${C.cyan}`,
              color: C.cyan, fontFamily: "'Orbitron', monospace", fontSize: "9px",
              letterSpacing: "2px", padding: "8px 16px", cursor: "pointer",
            }}>LOAD</button>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {hasContract && (
        <>
          {/* Phase stepper */}
          <PhaseStepper current={state.phase} />

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8, marginBottom: 20 }}>
            <StatBox label="Phase"    value={PHASE_LABELS[state.phase]}
              color={PHASE_COLORS[state.phase]} />
            <StatBox label="Minted"   value={`${state.minted} / ${state.minted + state.remaining}`} />
            <StatBox label="Reserved" value={`${state.reserveMinted} / ${state.reserveLimit}`}
              color={C.acid} />
            <StatBox label="Revealed" value={state.revealed ? "YES" : "NO"}
              color={state.revealed ? C.acid : C.muted} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8, marginBottom: 20 }}>
            <StatBox label="Presale Price" value={`${state.presalePrice} ETH`} color={C.cyan} />
            <StatBox label="Public Price"  value={`${state.publicPrice} ETH`}  color={C.cyan} />
            <StatBox label="Owner"
              value={state.isOwner ? `YOU (${truncate(state.signerAddr)})` : truncate(state.owner)}
              color={state.isOwner ? C.acid : C.muted} />
          </div>

          {/* Non-owner warning */}
          {!state.isOwner && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
              color: C.pink, padding: "10px 14px", border: `1px solid ${C.pinkDim}`,
              marginBottom: 16 }}>
              ⚠ Connected wallet is not the contract owner — write actions will fail
            </div>
          )}

          {/* Actions by phase */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px",
              letterSpacing: "3px", color: C.muted, marginBottom: 12,
              borderBottom: `1px solid ${C.ghost}`, paddingBottom: 8 }}>
              PHASE ACTIONS
            </div>

            {/* PAUSED → PRESALE */}
            {state.phase === 0 && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <Label>Merkle Root (presale allowlist)</Label>
                  <input value={merkleRoot} onChange={e => setMerkleRoot(e.target.value)}
                    placeholder="0x..."
                    style={{ width: "100%", background: C.deep, border: `1px solid ${C.ghost}`,
                      color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "11px", padding: "8px 12px", outline: "none",
                      boxSizing: "border-box", marginBottom: 8 }} />
                </div>
                <ActionRow
                  label="Open Presale"
                  description="Sets the merkle root and advances phase PAUSED → PRESALE"
                  buttonLabel="SET PRESALE"
                  disabled={!merkleRoot || !state.isOwner}
                  onClick={async () => {
                    await contract.setMerkleRoot(merkleRoot);
                    return contract.setPhase(1);
                  }}
                />
              </>
            )}

            {/* PRESALE → PUBLIC */}
            {state.phase === 1 && (
              <ActionRow
                label="Open Public Mint"
                description="Advances phase PRESALE → PUBLIC, opening minting to all wallets"
                buttonLabel="SET PUBLIC"
                disabled={!state.isOwner}
                onClick={() => contract.setPhase(2)}
              />
            )}

            {/* PUBLIC — reserve mint + close */}
            {state.phase === 2 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto",
                  gap: 8, marginBottom: 8 }}>
                  <div>
                    <Label>Reserve Recipient</Label>
                    <input value={reserveTo} onChange={e => setReserveTo(e.target.value)}
                      placeholder="0x..."
                      style={{ width: "100%", background: C.deep, border: `1px solid ${C.ghost}`,
                        color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "11px", padding: "8px 12px", outline: "none",
                        boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <input value={reserveQty} onChange={e => setReserveQty(e.target.value)}
                      type="number" min="1"
                      style={{ width: 70, background: C.deep, border: `1px solid ${C.ghost}`,
                        color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "11px", padding: "8px 12px", outline: "none" }} />
                  </div>
                </div>
                <ActionRow
                  label="Reserve Mint"
                  description="Mints reserved tokens to treasury wallet (owner only)"
                  buttonLabel="RESERVE"
                  disabled={!reserveTo || !state.isOwner}
                  onClick={() => contract.reserveMint(reserveTo, Number(reserveQty))}
                />
                <ActionRow
                  label="Close Sale"
                  description="Advances phase PUBLIC → CLOSED. No more public minting."
                  buttonLabel="CLOSE SALE"
                  disabled={!state.isOwner}
                  danger
                  onClick={() => contract.setPhase(3)}
                />
              </>
            )}

            {/* CLOSED — reveal + handoff */}
            {state.phase === 3 && !state.revealed && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <Label>Base URI (IPFS folder, trailing slash)</Label>
                  <input value={baseURI} onChange={e => setBaseURI(e.target.value)}
                    placeholder="ipfs://QmYourCID/"
                    style={{ width: "100%", background: C.deep, border: `1px solid ${C.ghost}`,
                      color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "11px", padding: "8px 12px", outline: "none",
                      boxSizing: "border-box", marginBottom: 8 }} />
                </div>
                <ActionRow
                  label="Reveal Collection"
                  description="Sets base URI and flips all tokens to their final metadata. Irreversible."
                  buttonLabel="REVEAL"
                  disabled={!baseURI || !state.isOwner}
                  danger
                  onClick={() => contract.reveal(baseURI)}
                />
              </>
            )}

            {state.phase === 3 && state.revealed && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <Label>DAO / Gnosis Safe Address</Label>
                  <input value={daoAddress} onChange={e => setDaoAddress(e.target.value)}
                    placeholder="0x..."
                    style={{ width: "100%", background: C.deep, border: `1px solid ${C.ghost}`,
                      color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "11px", padding: "8px 12px", outline: "none",
                      boxSizing: "border-box", marginBottom: 8 }} />
                </div>
                <ActionRow
                  label="DAO Handoff"
                  description="Transfers contract ownership to the DAO multisig. IRREVERSIBLE."
                  buttonLabel="HANDOFF"
                  disabled={!daoAddress || !state.isOwner}
                  danger
                  onClick={() => contract.daoHandoff(daoAddress)}
                />
              </>
            )}
          </div>

          {/* Financials */}
          <div style={{ marginTop: 20, borderTop: `1px solid ${C.ghost}`, paddingTop: 16 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px",
              letterSpacing: "3px", color: C.muted, marginBottom: 12 }}>
              FINANCIALS
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label>Withdraw To</Label>
              <input value={withdrawTo} onChange={e => setWithdrawTo(e.target.value)}
                placeholder="0x..."
                style={{ width: "100%", background: C.deep, border: `1px solid ${C.ghost}`,
                  color: C.cream, fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px", padding: "8px 12px", outline: "none",
                  boxSizing: "border-box", marginBottom: 8 }} />
            </div>
            <ActionRow
              label="Withdraw ETH"
              description="Sweeps all ETH from the contract to the recipient address"
              buttonLabel="WITHDRAW"
              disabled={!withdrawTo || !state.isOwner}
              onClick={() => contract.withdraw(withdrawTo)}
            />
          </div>

          {/* Refresh */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => refresh()} disabled={loading} style={{
              background: "transparent", border: `1px solid ${C.ghost}`,
              color: C.muted, fontFamily: "'Share Tech Mono', monospace",
              fontSize: "9px", letterSpacing: "1px", padding: "6px 14px",
              cursor: loading ? "default" : "pointer",
            }}>
              {loading ? "LOADING..." : "↻ REFRESH"}
            </button>
          </div>
        </>
      )}

      {/* Ethers note */}
      {!window.ethers && connected === false && (
        <div style={{ marginTop: 12, fontFamily: "'Share Tech Mono', monospace",
          fontSize: "9px", color: C.muted }}>
          Requires ethers.js — install with <span style={{ color: C.acid }}>npm install ethers</span>
        </div>
      )}
    </div>
  );
}
