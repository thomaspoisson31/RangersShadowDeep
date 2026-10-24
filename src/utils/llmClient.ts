import type { LLMSettings, Token, LogEntry } from '../types/gameState';
import type { Scenario } from '../types/gameData';

export function serializeGameStateForLLM(
  scenario: Scenario | null,
  tokens: Token[],
  logs: LogEntry[],
  turnNumber: number,
  phase: string
): string {
  const heroTokens = tokens.filter((t) => t.category === 'ranger' || t.category === 'companion');
  const monsterTokens = tokens.filter((t) => t.category === 'monster');
  const clueTokens = tokens.filter((t) => t.category === 'clue');

  const heroesSummary = heroTokens
    .map(
      (h) =>
        `- ${h.name} (${h.category}): HP ${h.currentHp}/${h.maxHp}, Fight +${h.fight}, Armour ${h.armor}, Pos (${h.x.toFixed(1)}", ${h.y.toFixed(1)}")`
    )
    .join('\n');

  const monstersSummary = monsterTokens
    .map(
      (m) =>
        `- ${m.name}: HP ${m.currentHp}/${m.maxHp}, Fight +${m.fight}, Armour ${m.armor}, Pos (${m.x.toFixed(1)}", ${m.y.toFixed(1)}")`
    )
    .join('\n');

  const cluesSummary = clueTokens
    .map(
      (c) =>
        `- Clue Marker ${c.clueId || ''}: ${c.status.isSearched ? 'Searched' : 'Unsearched'}, Pos (${c.x.toFixed(1)}", ${c.y.toFixed(1)}")`
    )
    .join('\n');

  const recentLogsSummary = logs
    .slice(0, 8)
    .map((l) => `[T${l.turnNumber} ${l.phase.toUpperCase()}] ${l.message}`)
    .join('\n');

  return `
You are the Game Master AI for a solo game of "Rangers of Shadow Deep".
Arbitrate tactical ambiguities, interpret rules fairly according to official game mechanics, or narrate immersive dark fantasy combat outcomes.

CURRENT GAME STATE:
Scenario: ${scenario ? scenario.title : 'Custom Battle'}
Turn: ${turnNumber} | Current Phase: ${phase}

HEROES:
${heroesSummary || 'None'}

MONSTERS / ENEMIES:
${monstersSummary || 'None on board'}

MAP MARKERS / CLUES:
${cluesSummary || 'None'}

RECENT BATTLEFIELD LOGS:
${recentLogsSummary || 'No recent actions'}
`.trim();
}

export async function askAiGameMaster(
  userQuery: string,
  settings: LLMSettings,
  scenario: Scenario | null,
  tokens: Token[],
  logs: LogEntry[],
  turnNumber: number,
  phase: string
): Promise<string> {
  if (!settings.apiKey) {
    return 'Please enter your API Key in Settings to ask the AI Game Master.';
  }

  const systemContext = serializeGameStateForLLM(scenario, tokens, logs, turnNumber, phase);

  try {
    if (settings.provider === 'openai' || settings.provider === 'custom') {
      const endpoint = settings.baseUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o',
          temperature: settings.temperature ?? 0.5,
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: userQuery },
          ],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response generated.';
    } else if (settings.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemContext,
          messages: [{ role: 'user', content: userQuery }],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Anthropic API error (${response.status})`);
      }

      const data = await response.json();
      return data.content?.[0]?.text || 'No response generated.';
    } else if (settings.provider === 'google') {
      const model = settings.model || 'gemini-1.5-pro';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemContext}\n\nUSER QUESTION: ${userQuery}` }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google GenAI API error (${response.status})`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    }

    return 'Unsupported AI provider configured.';
  } catch (err: any) {
    return `Error reaching AI Arbitrator: ${err.message || 'Network request failed'}`;
  }
}
