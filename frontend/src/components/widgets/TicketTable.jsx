import { Badge } from '../Badge';
import { usePagination, Pagination } from '../Pagination';
import { statusClass, priorityClass, formatDate } from '../../utils';

const TICKETS_PER_PAGE = 5;

export function TicketTable({ tickets }) {
  const {
    page,
    pageItems,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
  } = usePagination(tickets, TICKETS_PER_PAGE);

  if (tickets.length === 0) {
    return <div className="empty-state">No tickets match the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="ticket-table">
        <thead>
          <tr>
            <th className="ticket-table__col-id">ID</th>
            <th className="ticket-table__col-title">Title</th>
            <th>Status</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((ticket) => (
            <tr key={ticket.id}>
              <td className="ticket-table__id">#{ticket.id}</td>
              <td className="ticket-table__title">{ticket.title}</td>
              <td>
                <Badge type={statusClass(ticket.status)} value={ticket.status} />
              </td>
              <td>{ticket.category}</td>
              <td>
                <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
              </td>
              <td className="ticket-table__date">{formatDate(ticket.created)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
