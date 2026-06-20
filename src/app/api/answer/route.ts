// POST /api/answer
// Takes { question: string, selectedAgentIds: [id1, id2, id3] }
// Returns { answers: [{ agentId, name, emoji, color, answer }] }

import { NextResponse } from "next/server";
import { groq, MODEL } from "@/lib/groq";
import { getSelectedAgents } from "@/lib/agents";

export async function POST(req: Request) {
  const { question, selectedAgentIds } = await req.json();

  // Only run the 3 agents the asker picked
  const agents = getSelectedAgents(selectedAgentIds);

  const results = await Promise.all(
    agents.map(async (agent) => {
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
        answer: completion.choices[0]?.message?.content || "No response.",
      };
    })
  );

  return NextResponse.json({ answers: results });
}
