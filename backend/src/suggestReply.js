/**
 * Draft a ticket-chat reply from ticket context.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise a natural local draft.
 */

const MESSAGE_TYPES = new Set(['note', 'message']);

function recentMessageEntries(activity, limit = 12) {
  return (Array.isArray(activity) ? activity : [])
    .filter((e) => MESSAGE_TYPES.has(e?.type) && e?.text)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
    .slice(-limit);
}

function recentMessages(activity, limit = 12) {
  return recentMessageEntries(activity, limit)
    .map((m) => `${m.actor || 'Unknown'}: ${m.text}`)
    .join('\n');
}

function firstName(full) {
  if (!full) return '';
  return String(full).split(/[(\s]/)[0].trim();
}

function shortPlace(ticket) {
  return ticket.floor || ticket.location?.split('·')[0]?.trim() || '';
}

function clip(text, max = 100) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function inferIntent(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(eta|when|schedule|visit|arrive|tomorrow|today)\b/.test(t)) return 'timing';
  if (/\b(access|key|after[- ]?hours|ppe|permit)\b/.test(t)) return 'access';
  if (/\b(part|material|order|pump|valve|filter|spare)\b/.test(t)) return 'parts';
  if (/\b(leak|flood|smoke|smell|urgent|critical|asap|emergency)\b/.test(t)) {
    return 'urgent';
  }
  if (/\b(done|fixed|complete|closed|resolved|finished)\b/.test(t)) return 'done';
  if (/\b(photo|picture|evidence|upload)\b/.test(t)) return 'photo';
  if (/\?/.test(t)) return 'question';
  return 'general';
}

function buildFallbackSuggestion(ticket, role) {
  const msgs = recentMessageEntries(ticket.activity);
  const last = msgs.at(-1);
  const place = shortPlace(ticket);
  const who = firstName(ticket.assignee) || 'team';
  const intent = inferIntent(last?.text || ticket.title || ticket.description);
  const isUrgent =
    ticket.priority === 'Critical' ||
    ticket.priority === 'High' ||
    intent === 'urgent';

  if (role === 'contractor') {
    return contractorFallback(ticket, { last, place, intent, isUrgent });
  }
  return deskFallback(ticket, { last, place, who, intent, isUrgent });
}

function deskFallback(ticket, { last, place, who, intent, isUrgent }) {
  const at = place ? ` at ${place}` : '';
  const about = ticket.title ? ` — ${ticket.title}` : '';

  if (last) {
    const replyTo = clip(last.text, 90);
    const openers = [
      `Thanks for the update`,
      `Got it`,
      `Noted`,
      `Thanks ${firstName(last.actor) || who}`,
    ];

    if (intent === 'timing') {
      return pick([
        isUrgent
          ? `${pick(openers)}. This one’s high priority — can you lock in a visit window${at} and ping us once you’re on site?`
          : `${pick(openers)}. Can you lock in a visit window${at} and ping us once you’re on site?`,
        `${pick(openers)} on the timing. What’s your best ETA${at}? We’ll arrange access if you need it.`,
      ]);
    }
    if (intent === 'access') {
      return pick([
        `${pick(openers)}. Access notes are on the ticket — shout if keys / after-hours still look wrong and we’ll sort it.`,
        `Understood on access. We’ll confirm with the floor contact; anything else blocking you before you go${at}?`,
      ]);
    }
    if (intent === 'parts') {
      return pick([
        `${pick(openers)}. Once parts land, drop the ETA here so we can keep the requester in the loop.`,
        `Thanks — keep us posted on the parts lead time. If it’s slipping, we’ll flag the tenant early.`,
      ]);
    }
    if (intent === 'done') {
      return pick([
        `Great news — thanks. Can you confirm it’s fully closed out${at}, and upload a quick after photo if you haven’t already?`,
        `Nice work. We’ll mark it from our side once you’ve confirmed no follow-up is needed.`,
      ]);
    }
    if (intent === 'photo') {
      return `Perfect — photos help. Anything else we should know before we update the requester?`;
    }
    if (intent === 'question' || intent === 'urgent') {
      return pick([
        isUrgent
          ? `${pick(openers)}. Re: “${replyTo}” — please treat this as urgent. What’s the next step from your side?`
          : `${pick(openers)}. Re: “${replyTo}” — what’s the next step from your side?`,
        `Saw your note (“${replyTo}”). ${isUrgent ? 'Priority is high on this one. ' : ''}Can you share a short status + ETA when you can?`,
      ]);
    }
    return pick([
      `${pick(openers)}. Re your last note — any blockers, or are we still on track to wrap ${ticket.category || 'this'}${at}?`,
      `Thanks for keeping the thread moving. Quick check-in on #${ticket.id}${about}: anything you need from us?`,
    ]);
  }

  // No chat yet — natural first message
  if (ticket.status === 'Open') {
    return pick([
      `Hi ${who} — can you take a look at #${ticket.id}${about}${at}? ${isUrgent ? 'It’s marked urgent, so an early visit would help.' : 'A quick confirm + rough visit time is enough for now.'}`,
      `${who}, new one for you: ${ticket.title || 'maintenance issue'}${at}. Are you able to pick this up and share an ETA?`,
    ]);
  }
  if (ticket.status === 'In Progress') {
    return pick([
      `Hey ${who}, how’s #${ticket.id} coming along${at}? Any findings or ETA to close would be great.`,
      `${who} — checking in on the ${ticket.category || 'job'}${at}. Still progressing okay, or do you need anything from the desk?`,
    ]);
  }
  if (ticket.status === 'On Hold') {
    return `Hi ${who}, #${ticket.id} is on hold${at}. What’s blocking it, and what would unblock you?`;
  }
  return `Hi ${who}, just closing the loop on #${ticket.id}${at}. Anything left outstanding before we leave it?`;
}

function contractorFallback(ticket, { last, place, intent, isUrgent }) {
  const at = place ? ` on ${place}` : '';
  const issue = clip(ticket.title || ticket.category || 'the issue', 70);

  if (last) {
    const fromDesk = clip(last.text, 85);
    if (intent === 'timing') {
      return pick([
        `Can do — aiming to be${at} later today / next available slot. I’ll confirm once I’m en route.`,
        `Noted on timing. I’ll share a firmer ETA after I check the van schedule, then update here.`,
      ]);
    }
    if (intent === 'access') {
      return pick([
        `Thanks — I’ll follow the access notes on the ticket. If the key set doesn’t match I’ll message before I leave site.`,
        `Got the access info. Heading${at} shortly; will flag if after-hours is actually needed.`,
      ]);
    }
    if (intent === 'parts') {
      return pick([
        `Parts are the hold-up right now. I’ll update as soon as we have a delivery window, then book the return visit.`,
        `Still waiting on materials for ${issue}. Temporary make-safe is in place if needed — will confirm next steps here.`,
      ]);
    }
    if (intent === 'photo' || intent === 'question') {
      return pick([
        `Will do — I’ll add photos and a short note once I’m done${at}.`,
        `Understood (“${fromDesk}”). I’ll reply with findings + next action after the check.`,
      ]);
    }
    if (intent === 'done') {
      return `Yes — work looks complete${at}. I’ve left the area tidy; shout if you want a recheck.`;
    }
    return pick([
      `Thanks for the ping. I’m on ${issue}${at} — will update with findings shortly.`,
      `Seen your note. Continuing on site now; I’ll drop a clearer status once I’ve checked it properly.`,
    ]);
  }

  if (ticket.status === 'In Progress' || ticket.status === 'Open') {
    return pick([
      `On it — checking ${issue}${at}${isUrgent ? ' now (priority).' : '.'} Will update once I’ve seen the extent.`,
      `Arrived${at} for ${issue}. Doing a first look and will message what’s needed (parts / access / ETA).`,
      `Quick update: attending ${issue}${at}. So far looking into it — more detail after the inspection.`,
    ]);
  }
  if (ticket.status === 'On Hold') {
    return `Still on hold for ${issue}${at}. Main blocker from my side — I’ll unblock as soon as I can and post here.`;
  }
  return `Wrapped up on ${issue}${at}. Happy to answer any follow-up if something comes back.`;
}

function buildPrompt(ticket, role) {
  const thread = recentMessages(ticket.activity);
  const perspective =
    role === 'contractor'
      ? 'You are the assigned contractor/vendor chatting with the facilities desk in a ticket thread.'
      : 'You are a facilities desk coordinator chatting with the assignee/vendor in a ticket thread.';

  return `${perspective}

Write ONE natural chat reply — like a real person texting at work, not a formal email or ticket template.

Tone rules:
- Warm, clear, conversational (contractions OK: I'll, we're, what's)
- 1–3 short sentences max
- React to the latest message when there is one (answer questions, acknowledge updates)
- Mention place/issue only if it helps; don't recite the whole ticket
- No markdown, no bullet lists, no "Dear…", no "Please be advised"
- Don't invent ETAs, costs, part numbers, or completed work
- Don't start with "Update on #…" or "Checking in on ticket #"

Ticket context:
- ID: #${ticket.id}
- Title: ${ticket.title || ''}
- Status: ${ticket.status || ''}
- Priority: ${ticket.priority || ''}
- Category: ${ticket.category || ''}
- Location: ${ticket.location || ''}
- Floor: ${ticket.floor || ''}
- Assignee: ${ticket.assignee || ''}
- Description: ${ticket.description || ''}

Recent chat (oldest → newest):
${thread || '(no messages yet — write a natural first message)'}`;
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
      temperature: 0.75,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content:
            'You write natural workplace chat messages for building maintenance tickets. Sound human and helpful. Output only the reply text.',
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
  return text.replace(/^["']|["']$/g, '');
}

async function suggestReply(ticket, role = 'desk') {
  const safeRole = role === 'contractor' ? 'contractor' : 'desk';
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      suggestion: buildFallbackSuggestion(ticket, safeRole),
      source: 'fallback',
    };
  }

  try {
    const suggestion = await callOpenAI(buildPrompt(ticket, safeRole), apiKey);
    return { suggestion, source: 'openai' };
  } catch (err) {
    return {
      suggestion: buildFallbackSuggestion(ticket, safeRole),
      source: 'fallback',
      warning: err.message || 'OpenAI unavailable; used local draft',
    };
  }
}

module.exports = { suggestReply };
