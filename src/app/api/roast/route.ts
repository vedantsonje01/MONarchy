// POST /api/roast
// Takes { question: string, answers: [{ agentId, name, answer }] }
// Returns { roasts: [{ fromAgentId, fromName, toAgentId, toName, roast }] }
// Only roasts among the selected 3 agents (6 roasts total: each roasts the other two)

import { NextResponse } from "next/server";
import { groq, MODEL } from "@/lib/groq";
import { getSelectedAgents } from "@/lib/agents";

export async function POST(req: Request) {
  const { question, answers } = await req.json();

  // Get the selected agents from the answers that were passed in
  const selectedIds = answers.map((a: { agentId: string }) => a.agentId);
  const agents = getSelectedAgents(selectedIds);

  // Each of the 3 selected agents roasts the other two = 6 roasts
  const roastPromises = agents.flatMap((agent) => {
    const others = answers.filter(
      (a: { agentId: string }) => a.agentId !== agent.id
    );

    return others.map(async (target: { agentId: string; name: string; answer: string }) => {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `${agent.systemPrompt}\n\nYou are now in ROAST MODE. You just answered a question and now you're reviewing a rival agent's answer. Be witty, sharp, and brutally honest — but substantive. Attack the logic, not the person. Keep it under 2 sentences.`,
          },
          {
            role: "user",
            content: `The question was: "${question}"\n\n${target.name} answered: "${target.answer}"\n\nRoast their answer:`,
          },
        ],
        temperature: Math.min(agent.temperature + 0.2, 1.2),
        max_tokens: 100,
      });

      return {
        fromAgentId: agent.id,
        fromName: agent.name,
        toAgentId: target.agentId,
        toName: target.name,
        roast: completion.choices[0]?.message?.content || "...",
      };
    });
  });

  const roasts = await Promise.all(roastPromises);

  return NextResponse.json({ roasts });
}
