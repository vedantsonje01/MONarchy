// GET /api/agents
// Returns the full roster so the frontend doesn't need to hardcode agent data.
// Excludes sensitive fields (addressEnvKey, full systemPrompt).

import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";

export async function GET() {
  const roster = AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    color: a.color,
    temperature: a.temperature,
    // Resolve the wallet address for display (balance, reputation badge)
    address: process.env[a.addressEnvKey] ?? null,
  }));

  return NextResponse.json({ agents: roster });
}
