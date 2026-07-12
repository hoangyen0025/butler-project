import { StatusColumn } from './StatusColumn';
import { UrgentStrip } from './UrgentStrip';

export function StatusBoard({ tickets, onFilterUrgent }) {
  const statuses = ['Open', 'In Progress', 'On Hold', 'Closed'];

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="status-board-wrap">
      <UrgentStrip tickets={tickets} onFilterUrgent={onFilterUrgent} />
      <div className="status-board">
        {statuses.map((status) => (
          <StatusColumn key={status} status={status} tickets={grouped[status]} />
        ))}
      </div>
    </div>
  );
}
