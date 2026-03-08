/**
 * Momo Candie DAO — AI Agent API Server
 *
 * Exposes a single SSE endpoint:
 *   GET /api/analyze
 *
 * The endpoint orchestrates four Claude agents sequentially, streaming
 * each agent's text output as Server-Sent Events so the React frontend
 * can render tokens in real time without waiting for the full response.
 *
 * Event shape:
 *   { type: "agent_start",  agent: "data" | "risk" | "timing" | "synthesis" }
 *   { type: "token",        agent: <same>, text: <string> }
 *   { type: "agent_done",   agent: <same>, output: <full text> }
 *   { type: "done" }
 *   { type: "error",        message: <string> }
 */

import express from "express";
import cors from "cors";
import { runDataAgent, runRiskAgent, runTimingAgent, runSynthesisAgent } from "./agents.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));

// ── SSE helper ────────────────────────────────────────────────────
function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// ── /api/analyze ─────────────────────────────────────────────────
app.get("/api/analyze", async (req, res) => {
  // Check API key early so the client gets a clear error
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── Agent 1: Data ───────────────────────────────────────────
    sendEvent(res, { type: "agent_start", agent: "data" });
    let dataOutput = "";
    await runDataAgent((token) => {
      dataOutput += token;
      sendEvent(res, { type: "token", agent: "data", text: token });
    });
    sendEvent(res, { type: "agent_done", agent: "data", output: dataOutput });

    // ── Agent 2: Risk ───────────────────────────────────────────
    sendEvent(res, { type: "agent_start", agent: "risk" });
    let riskOutput = "";
    await runRiskAgent(dataOutput, (token) => {
      riskOutput += token;
      sendEvent(res, { type: "token", agent: "risk", text: token });
    });
    sendEvent(res, { type: "agent_done", agent: "risk", output: riskOutput });

    // ── Agent 3: Timing ─────────────────────────────────────────
    sendEvent(res, { type: "agent_start", agent: "timing" });
    let timingOutput = "";
    await runTimingAgent((token) => {
      timingOutput += token;
      sendEvent(res, { type: "token", agent: "timing", text: token });
    });
    sendEvent(res, { type: "agent_done", agent: "timing", output: timingOutput });

    // ── Agent 4: Synthesis ──────────────────────────────────────
    sendEvent(res, { type: "agent_start", agent: "synthesis" });
    let synthesisOutput = "";
    await runSynthesisAgent(
      { dataOutput, riskOutput, timingOutput },
      (token) => {
        synthesisOutput += token;
        sendEvent(res, { type: "token", agent: "synthesis", text: token });
      }
    );
    sendEvent(res, { type: "agent_done", agent: "synthesis", output: synthesisOutput });

    sendEvent(res, { type: "done" });
  } catch (err) {
    console.error("[agent error]", err);
    sendEvent(res, { type: "error", message: err.message });
  } finally {
    res.end();
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[agents] Server listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[agents] WARNING: ANTHROPIC_API_KEY is not set");
  }
});
