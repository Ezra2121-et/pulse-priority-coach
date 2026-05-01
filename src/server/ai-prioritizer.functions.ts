import { createServerFn } from "@tanstack/react-start";

interface TaskForAI {
  name: string;
  urgency: number;
  effort: number;
  due_date: string;
  status: string;
  tags: string[];
}

export const getAIPrioritization = createServerFn({ method: "POST" })
  .inputValidator((data: { tasks: TaskForAI[] }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { suggestion: "AI prioritization is not available." };

    const taskList = data.tasks
      .map((t, i) => `${i + 1}. "${t.name}" — Urgency: ${t.urgency}/5, Effort: ${t.effort}/5, Due: ${t.due_date}, Status: ${t.status}, Tags: ${t.tags.join(", ") || "none"}`)
      .join("\n");

    const prompt = `You are a productivity coach. Analyze these tasks and suggest the optimal order to work on them. Give a brief reasoning for your top 3 picks. Be concise (max 150 words).

Tasks:
${taskList}

Respond in this format:
🥇 [Task name] — [Why first]
🥈 [Task name] — [Why second]  
🥉 [Task name] — [Why third]

💡 Quick tip: [One actionable productivity tip based on their task list]`;

    try {
      const response = await fetch("https://ai.lovable.dev/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a concise productivity coach. Give actionable task prioritization advice." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        return { suggestion: "AI prioritization is temporarily unavailable. Try again later." };
      }

      const result = await response.json();
      const suggestion = result.choices?.[0]?.message?.content || "Could not generate suggestion.";
      return { suggestion };
    } catch {
      return { suggestion: "AI prioritization is temporarily unavailable." };
    }
  });
