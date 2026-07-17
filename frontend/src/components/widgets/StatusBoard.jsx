import { StatusColumn } from './StatusColumn';
import { UrgentStrip } from './UrgentStrip';

export function StatusBoard({ filters }) {
  const statuses = ['Open', 'In Progress', 'On Hold', 'Closed'];

  return (
    <div className="status-board-wrap">
      <div id="status-board-urgent">
        <UrgentStrip filters={filters} />
      </div>
      <div className="status-board">
        {statuses.map((status) => (
          <StatusColumn key={status} status={status} filters={filters} />
        ))}
      </div>
    </div>
  );
}
