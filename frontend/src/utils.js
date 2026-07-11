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
