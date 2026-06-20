# MONarchy

> Before you ape into anything, convene the MONarchy.

**MONarchy** is a DeFi decision-making tool built for **Monad Blitz Mumbai V3** (June 20, 2026) under the theme *The Agent Economy.*

You post a crypto question. You put MON on the line. You pick a council of 3 specialist AI agents from a roster of 6. They answer, they roast each other, you crown the winner. The chain remembers everything.

---

## The Problem

You are about to make a crypto decision: ape into a new token, LP into a pool, hold or sell. You ask a single AI model. You get one neat answer with no skin in the game and no memory of whether that style of advice has ever worked well in practice.

MONarchy gives that decision a small on-chain arena instead of a one-shot reply window.

---

## How It Works

1. **Connect wallet** — MetaMask on Monad testnet
2. **Pick 3 agents** from a roster of 6 crypto specialists; each one shows an on-chain win count
3. **Post your question + 1 MON bounty** — the contract escrows the funds
4. **Council answers** — 3 parallel AI responses, grounded in base-layer whitepapers, each with a distinct personality
5. **Roast phase** — each agent gets a turn to tear into the other two
6. **Crown the winner** — sign in MetaMask; MON moves; reputation for that agent address ticks up on-chain
7. **Repeat** — reputation compounds across rounds in public view

---

## The 6 Specialists

Each agent represents a different angle on DeFi, tokens, and trade decisions:

| Agent | Angle |
|---|---|
| **DEGEN** | High-risk, high-conviction. First in, first out. |
| **QUANT** | Numbers only. If it cannot be modeled, it does not show up. |
| **VC CHAD** | Narrative over fundamentals. Is this worth backing. |
| **BOOMER** | Skeptic who has seen every cycle and trusts nothing shiny. |
| **NERD** | Protocol-level. Reads the contracts instead of the thread. |
| **DETECTIVE** | On-chain forensics. Follows the wallet, not the marketing. |

All 6 run on **Llama 3.3 70B via Groq**, with system prompts grounded in Bitcoin, Ethereum, Solana, and Monad whitepapers.

---

## On-Chain Reputation

Every win emits a `BountyAwarded` event on Monad. Reputation is computed from those events rather than from a private counter in a database. Anyone who cares enough can read the chain and arrive at the same numbers.

> Bad answers do not only miss out on a payout. They slip behind on reputation, and that history sits on-chain.

---

## Stack

| Layer | Choice |
|---|---|
| Smart contract | Solidity, deployed via Foundry to Monad testnet |
| Backend | Next.js API routes (`/api/answer`, `/api/roast`, `/api/reputation`) |
| LLM | Groq — Llama 3.3 70B |
| Frontend | v0 / Lovable — React + Tailwind |
| Wallet | RainbowKit + wagmi + viem |
| Deploy | Vercel |

---

## Architecture

```
[User + MetaMask]
      ↓ picks 3 of 6 agents, posts question + 1 MON bounty
[BountyEscrow.sol on Monad]
      ↓
[Next.js API Routes]
   ├─ /api/answer      → 3 parallel Groq calls (whitepaper-grounded)
   ├─ /api/roast       → 3 parallel Groq calls (cross-agent roasts)
   └─ /api/reputation  → reads BountyAwarded events via viem
      ↓
[Frontend] typewriter render → crown winner → awardBounty tx
      ↓
[BountyAwarded event] → MON to winner → reputation badge updates
```

---

## Smart Contract

`BountyEscrow.sol` exposes two functions. The first lets the asker lock MON into escrow when they post a question. The second lets the same asker release those funds to a chosen winner once the council has spoken. The asker is the only party who signs a transaction; agent addresses only ever receive funds, and no agent private keys need to exist inside the app.

---

## Reputation Implementation

The `/api/reputation` endpoint fetches all `BountyAwarded` events from the contract on Monad, starting from the deployment block. It counts how many times each agent address appears as the winner across those events, then returns a map from address to win count. The frontend picks that up on page load and after every payout, rendering the count as a badge on each roster card. There is no separate reputation counter stored anywhere; chain events act as the source of truth, and anyone who wants to can verify the numbers by reading those events directly.

---
