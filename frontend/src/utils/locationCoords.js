/** Approximate site coordinates (Hong Kong Central waterfront). */
export const BUILDING_CENTER = { lat: 22.28552, lng: 114.15769 };

/** Walk order: basement / parking → ground → upper floors → plant / roof. */
export const FLOOR_WALK_ORDER = [
  'B1',
  'Car Park',
  'Loading Bay',
  'G/F',
  'Lobby',
  '1/F',
  '2/F',
  '3/F',
  'Podium',
  '5/F',
  '8/F',
  '10/F',
  '12/F',
  '15/F',
  'Plant Room',
  'Rooftop',
];

/** Relative offsets per floor / zone so pins fan around the building. */
const FLOOR_OFFSETS = {
  B1: { lat: -0.00095, lng: -0.00055 },
  'G/F': { lat: -0.0002, lng: 0.0001 },
  '1/F': { lat: 0.00015, lng: 0.00035 },
  '2/F': { lat: 0.00035, lng: 0.00055 },
  '3/F': { lat: 0.00055, lng: 0.00025 },
  '5/F': { lat: 0.00075, lng: -0.00015 },
  '8/F': { lat: 0.00095, lng: -0.0004 },
  '10/F': { lat: 0.00115, lng: 0.0001 },
  '12/F': { lat: 0.00135, lng: 0.00045 },
  '15/F': { lat: 0.00155, lng: -0.00025 },
  Rooftop: { lat: 0.00185, lng: 0 },
  'Loading Bay': { lat: -0.00115, lng: 0.0007 },
  Lobby: { lat: 0.00005, lng: -0.0007 },
  'Car Park': { lat: -0.00135, lng: -0.00035 },
  'Plant Room': { lat: 0.00165, lng: 0.00075 },
  Podium: { lat: 0.00045, lng: -0.00085 },
};

const WING_NUDGE = {
  'North wing': { lat: 0.00012, lng: -0.00018 },
  'South wing': { lat: -0.00012, lng: 0.00018 },
  'Core A': { lat: 0.00008, lng: 0.00008 },
  'Core B': { lat: -0.00008, lng: -0.00008 },
  'Service corridor': { lat: 0.00005, lng: 0.00022 },
  'Tenant unit': { lat: -0.00016, lng: 0.00005 },
  'Common area': { lat: 0.00002, lng: -0.00012 },
  Exterior: { lat: 0.00022, lng: 0.00028 },
};

const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function hashJitter(seed, spread = 0.00008) {
  let h = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  const a = ((h % 1000) / 1000 - 0.5) * 2 * spread;
  const b = (((h / 1000) % 1000) / 1000 - 0.5) * 2 * spread;
  return { lat: a, lng: b };
}

export function floorWalkIndex(floor) {
  const key = floor || 'Unknown';
  const idx = FLOOR_WALK_ORDER.indexOf(key);
  return idx === -1 ? FLOOR_WALK_ORDER.length + 1 : idx;
}

export function getTicketCoordinates(ticket) {
  const floor = ticket.floor || 'G/F';
  const floorOff = FLOOR_OFFSETS[floor] || FLOOR_OFFSETS['G/F'];
  const wing = String(ticket.location || '').split('·')[0]?.trim();
  const wingOff = WING_NUDGE[wing] || { lat: 0, lng: 0 };
  const jitter = hashJitter(ticket.id);

  return {
    lat: BUILDING_CENTER.lat + floorOff.lat + wingOff.lat + jitter.lat,
    lng: BUILDING_CENTER.lng + floorOff.lng + wingOff.lng + jitter.lng,
  };
}

/**
 * Open jobs sorted for a contractor floor walk.
 * Order: floor (building walk) → priority → due date.
 */
export function buildFloorWalkRoute(tickets) {
  const open = (tickets || []).filter((t) => t.status !== 'Closed');

  const stops = [...open].sort((a, b) => {
    const floorDiff = floorWalkIndex(a.floor) - floorWalkIndex(b.floor);
    if (floorDiff !== 0) return floorDiff;

    const pa = PRIORITY_RANK[a.priority] ?? 4;
    const pb = PRIORITY_RANK[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;

    return String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'));
  });

  const byFloor = [];
  const floorMap = new Map();
  for (const ticket of stops) {
    const floor = ticket.floor || 'Unknown';
    if (!floorMap.has(floor)) {
      const group = { floor, tickets: [] };
      floorMap.set(floor, group);
      byFloor.push(group);
    }
    floorMap.get(floor).tickets.push(ticket);
  }

  return {
    stops,
    nextStop: stops[0] || null,
    floors: byFloor,
    stopCount: stops.length,
  };
}

/**
 * One pin per open job (contractor route map).
 */
export function buildJobPins(tickets, highlightId = null) {
  return (tickets || [])
    .filter((t) => t.status !== 'Closed')
    .map((ticket) => {
      const coords = getTicketCoordinates(ticket);
      return {
        id: ticket.id,
        floor: ticket.floor || 'Unknown',
        count: 1,
        label: ticket.title,
        detail: ticket.location || ticket.floor || '',
        highlight: highlightId != null && String(ticket.id) === String(highlightId),
        ticketId: ticket.id,
        ...coords,
      };
    });
}

/**
 * One pin per floor that currently has tickets.
 * Popup shows count + top categories.
 */
export function buildLocationPins(tickets) {
  const byFloor = new Map();

  for (const ticket of tickets) {
    const floor = ticket.floor || 'Unknown';
    if (!byFloor.has(floor)) {
      byFloor.set(floor, {
        floor,
        tickets: [],
        categories: {},
      });
    }
    const bucket = byFloor.get(floor);
    bucket.tickets.push(ticket);
    bucket.categories[ticket.category] =
      (bucket.categories[ticket.category] || 0) + 1;
  }

  return [...byFloor.values()].map((bucket) => {
    const sample = bucket.tickets[0];
    const coords = getTicketCoordinates({
      ...sample,
      id: `floor-${bucket.floor}`,
    });
    const topCategories = Object.entries(bucket.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ');

    return {
      id: bucket.floor,
      floor: bucket.floor,
      count: bucket.tickets.length,
      topCategories,
      label: bucket.floor,
      detail: `${bucket.tickets.length} ticket${
        bucket.tickets.length !== 1 ? 's' : ''
      } · ${topCategories}`,
      highlight: false,
      ...coords,
    };
  });
}
