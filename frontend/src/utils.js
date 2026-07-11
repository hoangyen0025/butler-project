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
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function countBy(tickets, key) {
  return tickets.reduce((acc, ticket) => {
    const value = ticket[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
