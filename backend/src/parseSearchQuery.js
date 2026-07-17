/**
 * Parse natural-language search into ticket filters.
 * Uses OpenAI when OPENAI_API_KEY is set; always has a local rule parser.
 */

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const CATEGORY_ALIASES = [
  { category: 'HVAC', patterns: [/\bhvac\b/i, /\bair\s*con\b/i, /\baircon\b/i, /\bac\b/i, /\bcooling\b/i, /\bheating\b/i, /\bchiller\b/i] },
  { category: 'Electrical', patterns: [/\belectrical\b/i, /\belectric\b/i, /\bpower\b/i, /\bsocket\b/i, /\bwiring\b/i, /\blighting\b/i] },
  { category: 'Plumbing', patterns: [/\bplumbing\b/i, /\bpipe\b/i, /\bdrain\b/i, /\btap\b/i, /\btoilet\b/i, /\bwater\s*leak\b/i] },
  { category: 'Lift', patterns: [/\blift\b/i, /\belevator\b/i] },
  { category: 'Security', patterns: [/\bsecurity\b/i, /\balarm\b/i, /\baccess\s*control\b/i, /\bdoor\s*lock\b/i] },
  { category: 'Safety', patterns: [/\bsafety\b/i, /\bfire\b/i, /\bextinguisher\b/i, /\bemergency\b/i] },
  { category: 'Cleaning', patterns: [/\bcleaning\b/i, /\bclean\b/i, /\bjanitor\b/i, /\bhousekeeping\b/i] },
  { category: 'IT', patterns: [/\bit\b/i, /\bnetwork\b/i, /\bwifi\b/i, /\bserver\b/i] },
  { category: 'Civil', patterns: [/\bcivil\b/i, /\bwall\b/i, /\bceiling\b/i, /\bflooring\b/i, /\bdoor\b/i] },
  { category: 'Landscaping', patterns: [/\blandscap/i, /\bgarden\b/i, /\bplant\b/i] },
];

const FLOOR_WORDS = [
  'Rooftop',
  'Lobby',
  'Podium',
  'Plant Room',
  'Loading Bay',
  'Car Park',
];

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function normalizeFloorToken(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const lower = s.toLowerCase();

  for (const name of FLOOR_WORDS) {
    if (lower === name.toLowerCase()) return name;
  }
  if (/^b1$/i.test(s) || /^basement\s*1$/i.test(s)) return 'B1';
  if (/^g\/?f$/i.test(s) || /^ground$/i.test(s) || /^gf$/i.test(s)) return 'G/F';

  const m = s.match(/^(\d+)\s*(?:\/?\s*f|f|floor)?$/i);
  if (m) return `${Number(m[1])}/F`;

  const m2 = s.match(/^(?:floor|lvl|level)\s*(\d+)$/i);
  if (m2) return `${Number(m2[1])}/F`;

  return null;
}

function extractFloors(query) {
  const floors = [];
  let rest = query;

  const patterns = [
    /\b(?:on|at)\s+(\d+)\s*(?:\/?\s*f|f|floor)\b/gi,
    /\b(?:floor|lvl|level)\s*(\d+)\b/gi,
    /\b(\d+)\s*\/\s*f\b/gi,
    /\b(\d+)f\b/gi,
    /\b(b1|g\/f|gf|ground|rooftop|lobby|podium|plant\s*room|loading\s*bay|car\s*park)\b/gi,
  ];

  for (const re of patterns) {
    rest = rest.replace(re, (match, g1) => {
      const floor = normalizeFloorToken(g1 || match);
      if (floor) floors.push(floor);
      return ' ';
    });
  }

  return { floors: unique(floors), rest };
}

function extractStatuses(query) {
  const statuses = [];
  let rest = query;

  const rules = [
    { status: 'In Progress', re: /\bin\s*progress\b/gi },
    { status: 'On Hold', re: /\bon\s*hold\b/gi },
    { status: 'Closed', re: /\b(closed|resolved|done|completed)\b/gi },
    { status: 'Open', re: /\b(open|new|unassigned)\b/gi },
  ];

  for (const { status, re } of rules) {
    if (re.test(rest)) {
      statuses.push(status);
      rest = rest.replace(re, ' ');
    }
  }

  return { statuses: unique(statuses), rest };
}

function extractPriorities(query) {
  const priorities = [];
  let rest = query;

  if (/\b(urgent|asap|emergency)\b/gi.test(rest)) {
    priorities.push('Critical', 'High');
    rest = rest.replace(/\b(urgent|asap|emergency)\b/gi, ' ');
  }

  for (const p of PRIORITIES) {
    const re = new RegExp(`\\b${p}\\b`, 'gi');
    if (re.test(rest)) {
      priorities.push(p);
      rest = rest.replace(re, ' ');
    }
  }

  return { priorities: unique(priorities), rest };
}

function extractCategories(query) {
  const categories = [];
  let rest = query;

  for (const { category, patterns } of CATEGORY_ALIASES) {
    let hit = false;
    for (const re of patterns) {
      if (re.test(rest)) {
        hit = true;
        rest = rest.replace(re, ' ');
      }
    }
    if (hit) categories.push(category);
  }

  return { categories: unique(categories), rest };
}

function extractOverdue(query) {
  const re = /\b(overdue|past\s*due|sla|late)\b/gi;
  const overdue = re.test(query);
  return {
    overdue,
    rest: overdue ? query.replace(re, ' ') : query,
  };
}

function cleanupKeywords(rest) {
  return rest
    .replace(/[^\w\s/-]+/g, ' ')
    .replace(/\b(the|a|an|on|at|in|for|with|and|or|to|of|my|all|tickets?|show|find|search|please)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function localParse(query) {
  let rest = String(query || '');

  const overduePart = extractOverdue(rest);
  rest = overduePart.rest;

  const floorPart = extractFloors(rest);
  rest = floorPart.rest;

  const statusPart = extractStatuses(rest);
  rest = statusPart.rest;

  const priorityPart = extractPriorities(rest);
  rest = priorityPart.rest;

  const categoryPart = extractCategories(rest);
  rest = categoryPart.rest;

  const keywords = cleanupKeywords(rest);

  const filters = {
    status: statusPart.statuses,
    category: categoryPart.categories,
    priority: priorityPart.priorities,
    floor: floorPart.floors,
    overdue: overduePart.overdue,
    search: keywords,
  };

  const interpretation = describeInterpretation(filters, query);

  return {
    filters,
    interpretation,
    source: 'local',
  };
}

function describeInterpretation(filters, original) {
  const parts = [];
  if (filters.category?.length) parts.push(filters.category.join(', '));
  if (filters.floor?.length) parts.push(filters.floor.join(', '));
  if (filters.status?.length) parts.push(filters.status.join(', '));
  if (filters.priority?.length) parts.push(filters.priority.join(', '));
  if (filters.overdue) parts.push('overdue');
  if (filters.search) parts.push(`text “${filters.search}”`);

  if (parts.length === 0) {
    return `Title search for “${String(original || '').trim()}”`;
  }
  return `Matched: ${parts.join(' · ')}`;
}

async function callOpenAIParse(query, apiKey, catalog) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const prompt = `Parse this facilities ticket search into JSON filters only.
Allowed categories: ${catalog.categories.join(', ')}
Allowed statuses: ${STATUSES.join(', ')}
Allowed priorities: ${PRIORITIES.join(', ')}
Allowed floors (examples): ${catalog.floors.slice(0, 20).join(', ')}

Return ONLY valid JSON:
{"status":[],"category":[],"priority":[],"floor":[],"overdue":false,"search":""}

Rules:
- overdue=true if user wants past-due / SLA breach tickets
- search = leftover keywords for title/description match (may be "")
- Use only allowed enum values
- Empty arrays if unknown

Query: ${query}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You convert natural language maintenance searches into JSON filters.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content?.trim();
  const parsed = JSON.parse(raw);

  const filters = {
    status: unique((parsed.status || []).filter((s) => STATUSES.includes(s))),
    category: unique(
      (parsed.category || []).filter((c) => catalog.categories.includes(c))
    ),
    priority: unique((parsed.priority || []).filter((p) => PRIORITIES.includes(p))),
    floor: unique(
      (parsed.floor || [])
        .map((f) => normalizeFloorToken(f) || f)
        .filter((f) => catalog.floors.includes(f) || FLOOR_WORDS.includes(f))
    ),
    overdue: Boolean(parsed.overdue),
    search: String(parsed.search || '').trim(),
  };

  // If AI dropped everything, fall back to local merge of search text
  if (
    !filters.status.length &&
    !filters.category.length &&
    !filters.priority.length &&
    !filters.floor.length &&
    !filters.overdue &&
    !filters.search
  ) {
    return localParse(query);
  }

  return {
    filters,
    interpretation: describeInterpretation(filters, query),
    source: 'openai',
  };
}

async function parseSearchQuery(query, catalog = {}) {
  const q = String(query || '').trim();
  if (!q) {
    return {
      filters: {
        status: [],
        category: [],
        priority: [],
        floor: [],
        overdue: false,
        search: '',
      },
      interpretation: 'Empty query',
      source: 'local',
    };
  }

  const local = localParse(q);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return local;

  try {
    const ai = await callOpenAIParse(q, apiKey, {
      categories: catalog.categories || CATEGORY_ALIASES.map((c) => c.category),
      floors: catalog.floors || [],
    });
    // Prefer AI, but keep local floors/categories if AI missed them and local found some
    const merged = {
      status: unique([...(ai.filters.status || []), ...(local.filters.status || [])]),
      category: unique([...(ai.filters.category || []), ...(local.filters.category || [])]),
      priority: unique([...(ai.filters.priority || []), ...(local.filters.priority || [])]),
      floor: unique([...(ai.filters.floor || []), ...(local.filters.floor || [])]),
      overdue: Boolean(ai.filters.overdue || local.filters.overdue),
      search: ai.filters.search || local.filters.search || '',
    };
    return {
      filters: merged,
      interpretation: describeInterpretation(merged, q),
      source: 'openai',
    };
  } catch {
    return local;
  }
}

module.exports = { parseSearchQuery, localParse };
