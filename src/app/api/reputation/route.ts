// GET /api/reputation
// Reads BountyAwarded events from the deployed contract on Monad testnet.
// Returns { reputation: { [agentId]: winCount } }
// Call this on page load and after every successful awardBounty tx.

import { NextResponse } from "next/server";
import { parseAbiItem } from "viem";
import { getPublicClient } from "@/lib/viem";
import { AGENTS } from "@/lib/agents";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Set CONTRACT_DEPLOY_BLOCK in .env.local to the block your contract was deployed at.
// Leaving it at 0 is safe for a fresh testnet — just slower on a chain with many blocks.
const DEPLOY_BLOCK = BigInt(process.env.CONTRACT_DEPLOY_BLOCK || "0");

export async function GET() {
  try {
    const client = getPublicClient();

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbiItem(
        "event BountyAwarded(uint256 indexed bountyId, address indexed winner, uint256 amount)"
      ),
      fromBlock: DEPLOY_BLOCK,
      toBlock: "latest",
    });

    // Count wins per winner address
    const winsByAddress: Record<string, number> = {};
    for (const log of logs) {
      const winner = (log.args.winner as string).toLowerCase();
      winsByAddress[winner] = (winsByAddress[winner] ?? 0) + 1;
    }

    // Map address counts → agent IDs using AGENT{N}_ADDRESS env vars
    const reputation: Record<string, number> = {};
    for (const agent of AGENTS) {
      const address = (process.env[agent.addressEnvKey] ?? "").toLowerCase();
      reputation[agent.id] = address ? (winsByAddress[address] ?? 0) : 0;
    }

    return NextResponse.json({ reputation });
  } catch (err) {
    console.error("[/api/reputation] Failed:", err);
    // Return zeroes on error so the frontend can still render
    const fallback: Record<string, number> = {};
    for (const agent of AGENTS) fallback[agent.id] = 0;
    return NextResponse.json({ reputation: fallback }, { status: 500 });
  }
}
