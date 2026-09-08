import type { CapabilityRole, QuestPlan } from '../types';

const schema = {
  type: 'OBJECT',
  properties: {
    questTitle: { type: 'STRING' },
    summary: { type: 'STRING' },
    totalEstimatedMinutes: { type: 'INTEGER' },
    tasks: {
      type: 'ARRAY', minItems: 3, maxItems: 8,
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' }, description: { type: 'STRING' }, estimatedMinutes: { type: 'INTEGER' },
          skill: { type: 'STRING', enum: ['anyone', 'cook', 'driver', 'adult'] }, doTogether: { type: 'BOOLEAN' },
          destination: { type: 'STRING' },
        },
        required: ['title', 'description', 'estimatedMinutes', 'skill', 'doTogether', 'destination'],
      },
    },
  },
  required: ['questTitle', 'summary', 'totalEstimatedMinutes', 'tasks'],
};

interface GeneratedTaskPayload {
  title: unknown;
  description: unknown;
  estimatedMinutes: unknown;
  skill: unknown;
  doTogether: unknown;
  destination?: unknown;
}

interface GeneratedPlanPayload {
  questTitle: unknown;
  summary: unknown;
  totalEstimatedMinutes: unknown;
  tasks: GeneratedTaskPayload[];
}

export async function breakDownChore(chore: string): Promise<QuestPlan> {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
  if (!key || key === 'your_api_key_here') throw new Error('Add EXPO_PUBLIC_GEMINI_API_KEY to .env and restart Expo.');
  const prompt = `You are the planning agent for SMAC, a cooperative family chores game. Break the chore into 3 to 8 small, specific and fairly shareable tasks. Use the least restrictive skill badge: anyone, cook, driver, or adult. For every driver task, put the exact destination or address explicitly supplied by the user in destination. If no destination was supplied, leave destination as an empty string so the family can add it before publishing. For non-driver tasks destination must be empty. Do not invent an address, name, age, family size, tool, or transport. Chore: ${chore.trim()}`;
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: .35, responseMimeType: 'application/json', responseSchema: schema } }),
    });
  } catch { throw new Error('Could not reach Gemini. Check the phone connection and try again.'); }
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || 'Gemini could not create a quest.');
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  const plan = JSON.parse(text) as GeneratedPlanPayload;
  if (!Array.isArray(plan.tasks)) throw new Error('Gemini returned an invalid task list.');
  const validRoles: CapabilityRole[] = ['anyone', 'adult', 'cook', 'driver'];
  return {
    questTitle: String(plan.questTitle), summary: String(plan.summary), totalEstimatedMinutes: Math.max(1, Number(plan.totalEstimatedMinutes)),
    tasks: plan.tasks.slice(0, 8).map((task, index) => ({
      id: index + 1, title: String(task.title), description: String(task.description), estimatedMinutes: Math.max(1, Number(task.estimatedMinutes)),
      skill: typeof task.skill === 'string' && validRoles.includes(task.skill as CapabilityRole) ? task.skill as CapabilityRole : 'anyone', doTogether: Boolean(task.doTogether), destination: String(task.destination || ''),
    })),
  };
}
