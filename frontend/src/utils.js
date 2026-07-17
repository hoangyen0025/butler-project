export function isUrgent(ticket) {
  return ticket.priority === 'High' || ticket.priority === 'Critical';
}

export function isActiveUrgent(ticket) {
  return isUrgent(ticket) && ticket.status !== 'Closed';
}

export function sortByUrgentFirst(tickets) {
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  return [...tickets].sort((a, b) => {
    const aUrgent = isUrgent(a) ? 0 : 1;
    const bUrgent = isUrgent(b) ? 0 : 1;
    if (aUrgent !== bUrgent) return aUrgent - bUrgent;

    const aPriority = priorityOrder[a.priority] ?? 4;
    const bPriority = priorityOrder[b.priority] ?? 4;
    if (aPriority !== bPriority) return aPriority - bPriority;

    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });
}

export function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

export function priorityClass(priority) {
  return priority.toLowerCase();
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = parseDateOnly(dateStr) || parseDateTime(dateStr);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Date + time when ISO datetime is present; falls back to date-only. */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const hasTime = String(dateStr).includes('T');
  if (!hasTime) return formatDate(dateStr);
  const date = parseDateTime(dateStr);
  if (!date) return formatDate(dateStr);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function parseDateTime(dateStr) {
  const ms = Date.parse(String(dateStr));
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

/** Whole days from created (or fromDate) to endDate (defaults to today UTC). */
export function daysBetween(fromDateStr, toDateStr = null) {
  const from = parseDateOnly(fromDateStr);
  if (!from) return 0;
  const to = toDateStr ? parseDateOnly(toDateStr) : parseDateOnly(new Date().toISOString().slice(0, 10));
  if (!to) return 0;
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Age + SLA summary for ticket detail chips.
 * SLA: Critical 1d, High 3d, Medium 7d, Low 14d (from dueDate if present).
 */
export function getTicketSla(ticket, todayStr = null) {
  const today = todayStr || new Date().toISOString().slice(0, 10);
  const ageDays = Math.max(0, daysBetween(ticket.created, today));
  const due = ticket.dueDate;
  const daysLeft = due ? daysBetween(today, due) : null;
  // daysBetween(today, due): positive = due is in future
  const overdue = ticket.status !== 'Closed' && due ? daysBetween(due, today) > 0 : false;
  const overdueBy = overdue ? daysBetween(due, today) : 0;

  let label;
  if (ticket.status === 'Closed') {
    label = `Closed · open ${ageDays} day${ageDays !== 1 ? 's' : ''}`;
  } else if (overdue) {
    label = `Open ${ageDays} day${ageDays !== 1 ? 's' : ''} · overdue ${overdueBy}d`;
  } else if (daysLeft != null) {
    label = `Open ${ageDays} day${ageDays !== 1 ? 's' : ''} · ${daysLeft}d left`;
  } else {
    label = `Open ${ageDays} day${ageDays !== 1 ? 's' : ''}`;
  }

  return {
    ageDays,
    daysLeft,
    overdue,
    overdueBy,
    label,
    tone: ticket.status === 'Closed' ? 'ok' : overdue ? 'overdue' : daysLeft != null && daysLeft <= 1 ? 'soon' : 'ok',
  };
}

/**
 * Compact SLA countdown for job cards: "Due in 4h" / "Overdue 1d".
 * Date-only dueDates use end-of-day UTC for hour countdowns.
 */
export function formatSlaCountdown(ticket, now = new Date()) {
  if (!ticket || ticket.status === 'Closed' || !ticket.dueDate) {
    return null;
  }

  const due = parseDateOnly(ticket.dueDate);
  if (!due) return null;

  const todayStr = now.toISOString().slice(0, 10);
  const overdueBy = daysBetween(ticket.dueDate, todayStr);
  if (overdueBy > 0) {
    return {
      text: `Overdue ${overdueBy}d`,
      tone: 'overdue',
    };
  }

  const dueEnd = new Date(
    Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate(), 23, 59, 59)
  );
  const msLeft = dueEnd.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)));

  if (hoursLeft <= 24) {
    return {
      text: hoursLeft <= 1 ? 'Due in <1h' : `Due in ${hoursLeft}h`,
      tone: 'soon',
    };
  }

  const daysLeft = daysBetween(todayStr, ticket.dueDate);
  return {
    text: `Due in ${daysLeft}d`,
    tone: daysLeft <= 2 ? 'soon' : 'ok',
  };
}

export function countBy(tickets, key) {
  return tickets.reduce((acc, ticket) => {
    const value = ticket[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
