// POST /api/answer
// Takes { question: string, selectedAgentIds: [id1, id2, id3] }
// Returns { answers: [{ agentId, name, emoji, color, answer }] }

import { NextResponse } from "next/server";
import { groq, MODEL } from "@/lib/groq";
import { getSelectedAgents } from "@/lib/agents";

export async function POST(req: Request) {
  try {
    const { question, selectedAgentIds } = await req.json();

    if (!question || !selectedAgentIds?.length) {
      return NextResponse.json(
        { error: "question and selectedAgentIds are required" },
        { status: 400 }
      );
    }

    const agents = getSelectedAgents(selectedAgentIds);

    const results = await Promise.all(
      agents.map(async (agent) => {
        try {
          const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
              { role: "system", content: agent.systemPrompt },
              { role: "user", content: question },
            ],
            temperature: agent.temperature,
            max_tokens: 300,
          });
          return {
            agentId: agent.id,
            name: agent.name,
            emoji: agent.emoji,
            color: agent.color,
            answer: completion.choices[0]?.message?.content?.trim() || "No response.",
          };
        } catch (err) {
          console.error("[answer] Agent", agent.id, "failed:", err);
          return {
            agentId: agent.id,
            name: agent.name,
            emoji: agent.emoji,
            color: agent.color,
            answer: "Agent failed to respond. Try again.",
          };
        }
      })
    );

    return NextResponse.json({ answers: results });
  } catch (err) {
    console.error("[/api/answer] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
