export function TicketAttachments({
  attachments = [],
  formatDate,
  onRemove,
  saving = false,
  emptyMessage,
}) {
  if (attachments.length === 0) {
    if (emptyMessage) {
      return <p className="contractor-job__empty">{emptyMessage}</p>;
    }
    return null;
  }

  return (
    <div className="ticket-attachments">
      {attachments.map((file) => (
        <figure key={file.id || file.url} className="ticket-attachments__item">
          <div className="ticket-attachments__media">
            <img src={file.url} alt={file.label} loading="lazy" />
            {onRemove && (
              <button
                type="button"
                className="ticket-attachments__remove"
                onClick={() => onRemove(file)}
                disabled={saving}
                aria-label={`Remove ${file.label || 'image'}`}
                title="Remove image"
              >
                Remove
              </button>
            )}
          </div>
          <figcaption>
            <strong>{file.label}</strong>
            {file.capturedAt ? ` · ${formatDate(file.capturedAt)}` : ''}
            {file.uploadedBy ? ` · ${file.uploadedBy}` : ''}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
