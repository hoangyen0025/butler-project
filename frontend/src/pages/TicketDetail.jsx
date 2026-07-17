import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { TicketActionsPanel } from '../components/TicketActionsPanel';
import { TicketAttachments } from '../components/TicketAttachments';
import { TicketChat } from '../components/TicketChat';
import { TicketSummary } from '../components/TicketSummary';
import { useMeta, useTicket } from '../hooks/useTickets';
import {
  formatDate,
  getTicketSla,
  priorityClass,
  statusClass,
} from '../utils';
import { downloadElementAsPdf } from '../utils/downloadPdf';
import '../components/TicketDetail.css';

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SELF_ACTOR = 'Dashboard User';

function IconPrint() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function activityLabel(entry) {
  if (entry.type === 'status' && entry.from && entry.to) {
    return `${entry.from} → ${entry.to}`;
  }
  if (entry.type === 'created') return 'Created';
  if (entry.type === 'note' || entry.type === 'message') return 'Note';
  if (entry.type === 'checklist') return 'Checklist';
  if (entry.type === 'assign') return 'Assignment';
  if (entry.type === 'quote') return 'Parts quote';
  if (entry.type === 'checkin') return 'Site check-in';
  return entry.type || 'Update';
}

function formatMoney(amount, currency = 'HKD') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-HK')}`;
}

export function TicketDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { ticket, loading, error, saving, refetch, updateTicket, removeAttachment, decideQuote } = useTicket(id);
  const { meta } = useMeta();
  const sla = ticket ? getTicketSla(ticket) : null;

  const fromSearch = location.state?.fromSearch || '';

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setStatus(ticket.status || '');
    setPriority(ticket.priority || '');
    setAssignee(ticket.assignee || '');
    setActionError(null);
  }, [ticket]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!chatOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chatOpen]);

  const assignees = useMemo(() => {
    const fromMeta = meta.assignees || [];
    const set = new Set(fromMeta);
    if (ticket?.assignee) set.add(ticket.assignee);
    return [...set].sort();
  }, [meta.assignees, ticket?.assignee]);

  const activity = [...(ticket?.activity || [])].sort((a, b) =>
    String(b.at).localeCompare(String(a.at))
  );
  const auditTrail = activity.filter(
    (entry) => entry.type !== 'note' && entry.type !== 'message'
  );
  const related = ticket?.related || [];
  const attachments = ticket?.attachments || [];
  const parts = ticket?.parts || [];
  const quoteRequests = ticket?.quoteRequests || [];
  const pendingQuotes = quoteRequests.filter((q) => q.status === 'pending');
  const vendor = ticket?.vendor;
  const cost = ticket?.cost;

  const relatedSummary = (() => {
    if (related.length === 0) return null;
    if (ticket.floor) {
      return `${related.length} other ticket${related.length !== 1 ? 's' : ''} near ${ticket.floor}`;
    }
    return `${related.length} related ticket${related.length !== 1 ? 's' : ''}`;
  })();

  const ticketLinkState = fromSearch ? { fromSearch } : undefined;

  const applyUpdates = async () => {
    if (!ticket) return;
    const patch = {};
    if (status && status !== ticket.status) patch.status = status;
    if (priority && priority !== ticket.priority) patch.priority = priority;
    if (assignee && assignee !== ticket.assignee) patch.assignee = assignee;

    if (Object.keys(patch).length === 0) {
      setActionError('Change status, priority, or assignee first.');
      return;
    }

    setActionError(null);
    try {
      await updateTicket(patch);
      setToast('Save changes successfully');
    } catch (err) {
      setActionError(err.message || 'Update failed');
    }
  };

  const sendChatMessage = async (text, meta) => {
    await updateTicket({
      note: text,
      actor: SELF_ACTOR,
      ...(meta?.source === 'voice' ? { noteSource: 'voice' } : {}),
    });
    setToast(meta?.source === 'voice' ? 'Voice note sent' : 'Message sent');
  };

  const handleQuoteDecision = async (quoteId, status) => {
    setActionError(null);
    try {
      await decideQuote(quoteId, status, SELF_ACTOR);
      setToast(status === 'approved' ? 'Part quote approved' : 'Part quote rejected');
    } catch (err) {
      setActionError(err.message || 'Could not update quote');
    }
  };

  const onRemoveAttachment = async (file) => {
    const attachmentId = file?.id || file?.url;
    if (!attachmentId) return;
    setActionError(null);
    try {
      await removeAttachment(attachmentId, { actor: SELF_ACTOR });
      setToast('Photo removed');
    } catch (err) {
      setActionError(err.message || 'Could not remove image');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!ticket || exportingPdf) return;
    const card = document.querySelector('.ticket-detail__card');
    if (!card) {
      setActionError('Ticket form not ready to export');
      return;
    }

    setActionError(null);
    setExportingPdf(true);
    try {
      await downloadElementAsPdf(card, `ticket-${ticket.id}.pdf`);
      setToast('PDF downloaded');
    } catch (err) {
      setActionError(err.message || 'Could not download PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="app app--ticket">
      {toast && (
        <div className="toast toast--success no-print" role="status" aria-live="polite">
          {toast}
        </div>
      )}
      <Header />
      <main className="main main--full">
        <div className="ticket-detail">
          <div className="ticket-detail__toolbar no-print">
            <div className="ticket-detail__nav">
              <Link to="/" className="ticket-detail__back">
                ← Dashboard
              </Link>
              {fromSearch ? (
                <Link
                  to={`/search?q=${encodeURIComponent(fromSearch)}`}
                  className="ticket-detail__back"
                >
                  ← Search “{fromSearch}”
                </Link>
              ) : (
                <Link to="/search" className="ticket-detail__back">
                  Search
                </Link>
              )}
            </div>
            <div className="ticket-detail__nav-actions">
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={handlePrint}
                aria-label="Print ticket"
                title="Print"
              >
                <IconPrint />
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={handleDownloadPdf}
                disabled={exportingPdf || loading || !ticket}
                aria-label="Download ticket as PDF"
                title={exportingPdf ? 'Preparing PDF…' : 'Download PDF'}
              >
                <IconDownload />
              </button>
            </div>
          </div>

          {loading && <div className="empty-state">Loading ticket…</div>}

          {!loading && error && (
            <div className="ticket-detail__error">
              <p className="empty-state">{error}</p>
              <div className="ticket-detail__actions">
                <button type="button" className="btn btn--outline" onClick={refetch}>
                  Retry
                </button>
                <Link to="/" className="btn btn--ghost">
                  Go home
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && ticket && (
            <article className="ticket-detail__card">
              <header className="ticket-detail__header">
                <div>
                  <p className="ticket-detail__id">#{ticket.id}</p>
                  <h2 className="ticket-detail__title">{ticket.title}</h2>
                  {ticket.location && (
                    <p className="ticket-detail__location">{ticket.location}</p>
                  )}
                </div>
                <div className="ticket-detail__badges">
                  <Badge type={statusClass(ticket.status)} value={ticket.status} />
                  <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
                  {sla && (
                    <span
                      className={`ticket-detail__sla ticket-detail__sla--${sla.tone}`}
                      title="Age and SLA status"
                    >
                      {sla.label}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`chat-launcher no-print${chatOpen ? ' chat-launcher--open' : ''}`}
                    onClick={() => setChatOpen((open) => !open)}
                    aria-label={chatOpen ? 'Close chat box' : 'Open chat box'}
                    aria-expanded={chatOpen}
                    title="Chat box"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </header>

              <TicketSummary
                ticketId={ticket.id}
                refreshKey={`${ticket.id}-${ticket.updated}-${(ticket.activity || []).length}`}
              />

              <dl className="ticket-detail__meta">
                <div>
                  <dt>Location</dt>
                  <dd>{ticket.location || '—'}</dd>
                </div>
                <div>
                  <dt>Reporter</dt>
                  <dd>{ticket.reporter || '—'}</dd>
                </div>
                <div>
                  <dt>Assignee</dt>
                  <dd>{ticket.assignee || '—'}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{ticket.category}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(ticket.created)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDate(ticket.updated)}</dd>
                </div>
                <div>
                  <dt>Due</dt>
                  <dd>{formatDate(ticket.dueDate)}</dd>
                </div>
                {vendor && (
                  <>
                    <div>
                      <dt>Vendor</dt>
                      <dd>{vendor.name}</dd>
                    </div>
                    <div>
                      <dt>Job reference</dt>
                      <dd>{vendor.jobRef}</dd>
                    </div>
                  </>
                )}
              </dl>

              <div className="ticket-detail__layout">
                <div className="ticket-detail__primary">
                  <section className="ticket-detail__body">
                    <h3>Description</h3>
                    <p>{ticket.description}</p>
                  </section>

                  {auditTrail.length > 0 && (
                    <section className="ticket-detail__section">
                      <div className="ticket-detail__section-head">
                        <h3>Activity timeline</h3>
                      </div>
                      <ul className="ticket-timeline">
                        {auditTrail.map((entry, index) => (
                          <li
                            key={`${entry.at}-${entry.type}-${index}`}
                            className={`ticket-timeline__item ticket-timeline__item--${entry.type || 'note'}`}
                          >
                            <div className="ticket-timeline__dot" aria-hidden="true" />
                            <div className="ticket-timeline__body">
                              <div className="ticket-timeline__top">
                                <span className="ticket-timeline__type">
                                  {activityLabel(entry)}
                                </span>
                                <time
                                  className="ticket-timeline__date"
                                  dateTime={entry.at}
                                >
                                  {formatDate(entry.at)}
                                </time>
                              </div>
                              <p className="ticket-timeline__text">{entry.text}</p>
                              <p className="ticket-timeline__actor">{entry.actor}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {attachments.length > 0 && (
                    <section className="ticket-detail__section">
                      <div className="ticket-detail__section-head">
                        <h3>Photos / attachments</h3>
                        <span className="ticket-detail__section-meta">
                          {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <TicketAttachments
                        attachments={attachments}
                        formatDate={formatDate}
                        onRemove={onRemoveAttachment}
                        saving={saving}
                      />
                    </section>
                  )}

                  {(parts.length > 0 || cost || quoteRequests.length > 0) && (
                    <section className="ticket-detail__section">
                      <div className="ticket-detail__section-head">
                        <h3>Parts & cost</h3>
                        {cost && (
                          <span className="ticket-detail__section-meta">
                            Est. {formatMoney(cost.estimated, cost.currency)} · Act.{' '}
                            {formatMoney(cost.actual, cost.currency)}
                          </span>
                        )}
                      </div>

                      {pendingQuotes.length > 0 && (
                        <div className="quote-approvals">
                          <h4 className="quote-approvals__title">
                            Pending vendor quotes ({pendingQuotes.length})
                          </h4>
                          <ul className="quote-list">
                            {pendingQuotes.map((quote) => (
                              <li
                                key={quote.id}
                                className="quote-list__item quote-list__item--pending"
                              >
                                <div className="quote-list__top">
                                  <strong>{quote.partName}</strong>
                                  <span className="quote-status quote-status--pending">
                                    pending
                                  </span>
                                </div>
                                <p className="quote-list__meta">
                                  × {quote.qty} ·{' '}
                                  {formatMoney(quote.unitCost, cost?.currency)} ea ·{' '}
                                  {formatMoney(quote.estimatedTotal, cost?.currency)}
                                  {quote.requestedBy ? ` · ${quote.requestedBy}` : ''}
                                  {quote.note ? ` · ${quote.note}` : ''}
                                </p>
                                <div className="quote-list__actions no-print">
                                  <button
                                    type="button"
                                    className="btn btn--primary"
                                    disabled={saving}
                                    onClick={() =>
                                      handleQuoteDecision(quote.id, 'approved')
                                    }
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn--outline"
                                    disabled={saving}
                                    onClick={() =>
                                      handleQuoteDecision(quote.id, 'rejected')
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {quoteRequests.some((q) => q.status !== 'pending') && (
                        <ul className="quote-list quote-list--history">
                          {[...quoteRequests]
                            .filter((q) => q.status !== 'pending')
                            .reverse()
                            .map((quote) => (
                              <li
                                key={quote.id}
                                className={`quote-list__item quote-list__item--${quote.status}`}
                              >
                                <div className="quote-list__top">
                                  <strong>{quote.partName}</strong>
                                  <span
                                    className={`quote-status quote-status--${quote.status}`}
                                  >
                                    {quote.status}
                                  </span>
                                </div>
                                <p className="quote-list__meta">
                                  × {quote.qty} ·{' '}
                                  {formatMoney(quote.estimatedTotal, cost?.currency)}
                                  {quote.decidedBy ? ` · by ${quote.decidedBy}` : ''}
                                </p>
                              </li>
                            ))}
                        </ul>
                      )}

                      {parts.length > 0 && (
                        <div className="ticket-parts">
                          <table>
                            <thead>
                              <tr>
                                <th>Material</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Line</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parts.map((part) => (
                                <tr key={`${part.name}-${part.qty}-${part.fromQuoteId || ''}`}>
                                  <td>{part.name}</td>
                                  <td>{part.qty}</td>
                                  <td>{formatMoney(part.unitCost, cost?.currency)}</td>
                                  <td>{formatMoney(part.lineTotal, cost?.currency)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {cost && (
                        <div className="ticket-cost">
                          <div>
                            <span>Estimated</span>
                            <strong>{formatMoney(cost.estimated, cost.currency)}</strong>
                          </div>
                          <div>
                            <span>Actual</span>
                            <strong>{formatMoney(cost.actual, cost.currency)}</strong>
                          </div>
                          <div>
                            <span>Variance</span>
                            <strong>
                              {formatMoney(
                                Number(cost.actual) - Number(cost.estimated),
                                cost.currency
                              )}
                            </strong>
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>

                <aside className="ticket-detail__aside">
                  <TicketActionsPanel
                    status={status}
                    priority={priority}
                    assignee={assignee}
                    statuses={STATUSES}
                    priorities={PRIORITIES}
                    assignees={assignees}
                    saving={saving}
                    actionError={actionError}
                    onStatusChange={setStatus}
                    onPriorityChange={setPriority}
                    onAssigneeChange={setAssignee}
                    onSave={applyUpdates}
                  />

                  <section className="ticket-detail__section no-print ticket-detail__panel">
                    <div className="ticket-detail__section-head">
                      <h3>Related tickets</h3>
                      {relatedSummary && (
                        <span className="ticket-detail__section-meta">
                          {relatedSummary}
                        </span>
                      )}
                    </div>
                    {related.length === 0 ? (
                      <p className="ticket-detail__empty">
                        No other tickets share this asset or floor/category.
                      </p>
                    ) : (
                      <ul className="ticket-related">
                        {related.map((item) => (
                          <li key={item.id}>
                            <Link
                              to={`/ticket/${item.id}`}
                              state={ticketLinkState}
                              className="ticket-related__link"
                            >
                              <span className="ticket-related__id">#{item.id}</span>
                              <span className="ticket-related__title">{item.title}</span>
                              <span className="ticket-related__meta">
                                {item.assetId ? `${item.assetId} · ` : ''}
                                {item.floor || '—'}
                              </span>
                              <span className="ticket-related__badges">
                                <Badge
                                  type={statusClass(item.status)}
                                  value={item.status}
                                />
                                <Badge
                                  type={priorityClass(item.priority)}
                                  value={item.priority}
                                />
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </aside>
              </div>

              {chatOpen && (
                <div className="chat-popup no-print" role="presentation">
                  <button
                    type="button"
                    className="chat-popup__backdrop"
                    aria-label="Close chat box"
                    onClick={() => setChatOpen(false)}
                  />
                  <div
                    className="chat-popup__panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Chat box"
                  >
                    <TicketChat
                      className="ticket-chat--popup"
                      ticketId={ticket.id}
                      activity={ticket.activity || []}
                      selfActor={SELF_ACTOR}
                      suggestRole="desk"
                      onSend={sendChatMessage}
                      saving={saving}
                      title="Chat box"
                      enableVoice
                      onClose={() => setChatOpen(false)}
                    />
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
