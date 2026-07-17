/**
 * One-line ticket summary from description + recent chat.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise a local draft.
 */

const MESSAGE_TYPES = new Set(['note', 'message']);

function recentMessages(activity, limit = 8) {
  return (Array.isArray(activity) ? activity : [])
    .filter((e) => MESSAGE_TYPES.has(e?.type) && e?.text)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
    .slice(-limit);
}

function shortPlace(ticket) {
  return ticket.floor || ticket.location?.split('·')[0]?.trim() || '';
}

function clip(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function buildFallbackSummary(ticket) {
  const place = shortPlace(ticket);
  const where = place ? ` @ ${place}` : '';
  const issue = clip(ticket.title || ticket.category || 'Maintenance issue', 56);
  const priority =
    ticket.priority === 'Critical' || ticket.priority === 'High'
      ? `${ticket.priority}`
      : ticket.priority || '';
  const status = ticket.status || 'Open';
  const who = ticket.assignee
    ? String(ticket.assignee).split(/[(\s]/)[0].trim()
    : 'Unassigned';

  const msgs = recentMessages(ticket.activity);
  const last = msgs
    .filter((m) => {
      const t = String(m.text).toLowerCase();
      return !/logged for contractor|ticket created|awaiting assignment/.test(t);
    })
    .at(-1);
  let next = '';

  if (status === 'Closed') {
    next = 'Closed — no open action';
  } else if (last) {
    const t = String(last.text).toLowerCase();
    if (/\b(eta|when|visit|schedule)\b/.test(t)) next = 'Awaiting visit / ETA';
    else if (/\b(part|order|material)\b/.test(t)) next = 'Parts / materials pending';
    else if (/\b(access|key|after[- ]?hours)\b/.test(t)) next = 'Access to confirm';
    else if (/\b(done|fixed|complete|resolved)\b/.test(t)) next = 'Verify & close';
    else next = `Latest: ${clip(last.text, 42)}`;
  } else if (status === 'Open') {
    next = 'Needs first response / visit';
  } else if (status === 'In Progress') {
    next = 'Work in progress — watch for update';
  } else if (status === 'On Hold') {
    next = 'On hold — unblock or reassign';
  } else {
    next = 'Check status';
  }

  const urgency = priority ? ` · ${priority}` : '';
  return `${issue}${where} · ${status}${urgency} · ${who} · ${next}`;
}

function buildPrompt(ticket) {
  const thread = recentMessages(ticket.activity)
    .map((m) => `${m.actor || 'Unknown'}: ${m.text}`)
    .join('\n');

  return `Summarize this facilities maintenance ticket in ONE line for a busy dashboard.

Include, in order if known: what/where · urgency or status · owner · next step.
Max ~140 characters. Plain text only. No quotes. No "Summary:" prefix.
Sound natural and scannable — not a full sentence essay.

Ticket:
- ID: #${ticket.id}
- Title: ${ticket.title || ''}
- Status: ${ticket.status || ''}
- Priority: ${ticket.priority || ''}
- Category: ${ticket.category || ''}
- Location: ${ticket.location || ''}
- Floor: ${ticket.floor || ''}
- Assignee: ${ticket.assignee || ''}
- Description: ${ticket.description || ''}

Recent chat:
${thread || '(none)'}`;
}

async function callOpenAI(prompt, apiKey) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 80,
      messages: [
        {
          role: 'system',
          content:
            'You write ultra-short one-line ticket summaries for facilities staff. Output only the summary line.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const error = new Error(`OpenAI error ${res.status}`);
    error.detail = errText.slice(0, 300);
    throw error;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty OpenAI response');
  return text.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
}

async function summarizeTicket(ticket) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      summary: buildFallbackSummary(ticket),
      source: 'fallback',
    };
  }

  try {
    const summary = await callOpenAI(buildPrompt(ticket), apiKey);
    return { summary, source: 'openai' };
  } catch (err) {
    return {
      summary: buildFallbackSummary(ticket),
      source: 'fallback',
      warning: err.message || 'OpenAI unavailable; used local summary',
    };
  }
}

module.exports = { summarizeTicket };
