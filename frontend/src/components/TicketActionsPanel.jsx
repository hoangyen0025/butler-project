export function TicketActionsPanel({
  status,
  priority,
  assignee,
  statuses,
  priorities,
  assignees,
  saving,
  actionError,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onSave,
}) {
  return (
    <section className="ticket-detail__section no-print ticket-actions ticket-detail__panel">
      <div className="ticket-detail__section-head">
        <h3>Actions</h3>
        {saving && (
          <span className="ticket-detail__section-meta">Saving…</span>
        )}
      </div>
      <div className="ticket-actions__grid">
        <label className="ticket-actions__field">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={saving}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="ticket-actions__field">
          <span>Priority</span>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            disabled={saving}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="ticket-actions__field">
          <span>Assign</span>
          <select
            value={assignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            disabled={saving}
          >
            {assignees.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ticket-actions__buttons">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onSave}
          disabled={saving}
        >
          Save changes
        </button>
      </div>
      {actionError && (
        <p className="ticket-actions__feedback ticket-actions__feedback--error">
          {actionError}
        </p>
      )}
    </section>
  );
}
