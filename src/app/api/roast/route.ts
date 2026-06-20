// POST /api/roast
// Takes { question: string, answers: [{ agentId, name, answer }] }
// Returns { roasts: [{ fromAgentId, fromName, toAgentId, toName, roast }] }
// Each of the 3 selected agents roasts the other two = 6 roasts total

import { NextResponse } from "next/server";
import { groq, MODEL } from "@/lib/groq";
import { getSelectedAgents } from "@/lib/agents";

export async function POST(req: Request) {
  try {
    const { question, answers } = await req.json();

    if (!question || !answers?.length) {
      return NextResponse.json(
        { error: "question and answers are required" },
        { status: 400 }
      );
    }

    const selectedIds = answers.map((a: { agentId: string }) => a.agentId);
    const agents = getSelectedAgents(selectedIds);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 3 roasts in a chain: agent[0]→agent[1], agent[1]→agent[2], agent[2]→agent[0]
    // 3 calls instead of 6 — stays well under Vercel timeout and Groq rate limits
    const roastPairs = agents.map((agent, i) => ({
      agent,
      target: answers.find((a: { agentId: string }) => a.agentId === agents[(i + 1) % agents.length].id) as { agentId: string; name: string; answer: string },
    })).filter(p => p.target);

    // Run sequentially with delay to avoid Groq rate limits
    const roasts = [];
    for (const { agent, target } of roastPairs) {
      await sleep(150);
      try {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: agent.systemPrompt + "\n\nYou are now in ROAST MODE. You just answered a question and now you are reviewing a rival agent's answer. Be witty, sharp, and brutally honest. Attack the logic, not the person. Keep it under 2 sentences.",
            },
            {
              role: "user",
              content: "The question was: \"" + question + "\"\n\n" + target.name + " answered: \"" + target.answer + "\"\n\nRoast their answer:",
            },
          ],
          temperature: Math.min(agent.temperature + 0.2, 1.2),
          max_tokens: 100,
        });
        roasts.push({
          fromAgentId: agent.id,
          fromName: agent.name,
          toAgentId: target.agentId,
          toName: target.name,
          roast: completion.choices[0]?.message?.content?.trim() || "...",
        });
      } catch (err) {
        console.error("[roast]", agent.id, "->", target.agentId, "failed:", err);
        roasts.push({
          fromAgentId: agent.id,
          fromName: agent.name,
          toAgentId: target.agentId,
          toName: target.name,
          roast: "(roast signal lost)",
        });
      }
    }
    return NextResponse.json({ roasts });
  } catch (err) {
    console.error("[/api/roast] Unhandled error:", err);
    return NextResponse.json({ roasts: [] }, { status: 500 });
  }
}
