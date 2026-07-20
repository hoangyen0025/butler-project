import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { ContractorQuoteForm } from '../components/ContractorQuoteForm';
import { Header } from '../components/Header';
import { TicketAttachments } from '../components/TicketAttachments';
import { TicketChat } from '../components/TicketChat';
import { TicketSummary } from '../components/TicketSummary';
import { useContractor, readFileAsDataUrl } from '../hooks/useContractor';
import { useTicket } from '../hooks/useTickets';
import { formatDate, formatSlaCountdown, priorityClass, statusClass } from '../utils';
import '../components/ContractorPortal.css';
import '../components/TicketDetail.css';

const CONTRACTOR_STATUSES = ['In Progress', 'On Hold', 'Closed'];
const EVIDENCE_KINDS = [
  { value: 'evidence', label: 'Site evidence' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'damage', label: 'Damage' },
  { value: 'leak', label: 'Leak / spill' },
];
const MAX_UPLOAD_BYTES = 700 * 1024;

export function ContractorJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contractor, username, isSignedIn, authChecking, clearContractor } = useContractor();
  const { ticket, loading, error, saving, refetch, updateTicket, addAttachment, removeAttachment, submitQuote } =
    useTicket(id);

  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('evidence');
  const [label, setLabel] = useState('');
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partCost, setPartCost] = useState('');
  const [partNote, setPartNote] = useState('');
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setStatus(
      CONTRACTOR_STATUSES.includes(ticket.status) ? ticket.status : 'In Progress'
    );
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

  if (authChecking) {
    return (
      <div className="app app--contractor">
        <Header showSearch={false} />
        <main className="main main--full">
          <div className="empty-state">Checking session…</div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/contractor" replace />;
  }

  const isAssigned = ticket && ticket.assignee === contractor;
  const attachments = ticket?.attachments || [];
  const quoteRequests = ticket?.quoteRequests || [];
  const vendor = ticket?.vendor;

  const formatHkd = (n) =>
    `HKD ${Number(n || 0).toLocaleString('en-HK')}`;

  const saveStatus = async () => {
    if (!ticket || !isAssigned) return;
    if (status === ticket.status) {
      setActionError('Pick a different status first.');
      return;
    }
    setActionError(null);
    try {
      await updateTicket({
        actor: contractor,
        asContractor: true,
        status,
      });
      setToast('Save changes successfully');
    } catch (err) {
      setActionError(err.message || 'Update failed');
    }
  };

  const sendChatMessage = async (text, meta) => {
    await updateTicket({
      actor: contractor,
      asContractor: true,
      note: text,
      ...(meta?.source === 'voice' ? { noteSource: 'voice' } : {}),
    });
    setToast(meta?.source === 'voice' ? 'Voice note sent' : 'Message sent');
  };

  const onUploadEvidence = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !ticket || !isAssigned) return;

    if (!file.type.startsWith('image/')) {
      setActionError('Please choose an image file.');
      return;
    }

    setActionError(null);
    try {
      let url;
      if (file.size > MAX_UPLOAD_BYTES) {
        url = `https://placehold.co/640x420/1a1e25/e07a4f/png?text=${encodeURIComponent(
          file.name.slice(0, 28)
        )}`;
      } else {
        url = await readFileAsDataUrl(file);
      }

      await addAttachment({
        actor: contractor,
        asContractor: true,
        kind,
        label: label.trim() || file.name || 'Photo evidence',
        url,
      });
      setLabel('');
      setToast('Photo evidence uploaded');
    } catch (err) {
      setActionError(err.message || 'Upload failed');
    }
  };

  const onRemoveEvidence = async (file) => {
    if (!ticket || !isAssigned || !file) return;
    const attachmentId = file.id || file.url;
    if (!attachmentId) return;

    setActionError(null);
    try {
      await removeAttachment(attachmentId, {
        actor: contractor,
        asContractor: true,
      });
      setToast('Photo removed');
    } catch (err) {
      setActionError(err.message || 'Could not remove image');
    }
  };

  const submitPartQuote = async (event) => {
    event.preventDefault();
    if (!ticket || !isAssigned) return;

    const qty = Number(partQty);
    const unitCost = Number(partCost);
    if (!partName.trim()) {
      setActionError('Enter the part or material needed.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setActionError('Quantity must be greater than zero.');
      return;
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setActionError('Estimated unit cost must be zero or greater.');
      return;
    }

    setActionError(null);
    try {
      await submitQuote({
        actor: contractor,
        asContractor: true,
        partName: partName.trim(),
        qty,
        unitCost,
        note: partNote.trim(),
      });
      setPartName('');
      setPartQty('1');
      setPartCost('');
      setPartNote('');
      setToast('Part quote sent for staff approval');
    } catch (err) {
      setActionError(err.message || 'Could not submit quote');
    }
  };

  return (
    <div className="app app--contractor">
      {toast && (
        <div className="toast toast--success no-print" role="status">
          {toast}
        </div>
      )}
      <Header showSearch={false} />
      <main className="main main--full">
        <div className="contractor-job">
          <div className="contractor-job__nav">
            <Link to="/contractor/jobs" className="contractor-job__back">
              ← Back to my jobs
            </Link>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={async () => {
                await clearContractor();
                navigate('/contractor');
              }}
            >
              Sign out
            </button>
          </div>

          {loading && <div className="empty-state">Loading job…</div>}

          {!loading && error && (
            <div className="contractor-jobs__error">
              <p className="empty-state">{error}</p>
              <button type="button" className="btn btn--outline" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && ticket && !isAssigned && (
            <div className="empty-state">
              This job is assigned to {ticket.assignee || 'someone else'}, not {contractor}.
            </div>
          )}

          {!loading && !error && ticket && isAssigned && (
            <article className="contractor-job__card">
              <header className="contractor-job__header">
                <div className="contractor-job__header-main">
                  <p className="contractor-job__id">#{ticket.id}</p>
                  <h2 className="contractor-job__title">{ticket.title}</h2>
                  <p className="contractor-job__location">{ticket.location}</p>
                </div>

                <dl className="contractor-job__meta contractor-job__meta--header">
                  <div>
                    <dt>Job reference</dt>
                    <dd>{vendor?.jobRef || '—'}</dd>
                  </div>
                  <div>
                    <dt>Asset ID</dt>
                    <dd>{ticket.assetId || '—'}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDate(ticket.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{ticket.category}</dd>
                  </div>
                </dl>

                <div className="contractor-job__badges">
                  <Badge type={statusClass(ticket.status)} value={ticket.status} />
                  <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
                  {(() => {
                    const sla = formatSlaCountdown(ticket);
                    if (!sla) return null;
                    return (
                      <span
                        className={`job-sla job-sla--${sla.tone}`}
                        title={`Due ${ticket.dueDate}`}
                      >
                        {sla.text}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    className={`chat-launcher${chatOpen ? ' chat-launcher--open' : ''}`}
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

              <div className="contractor-job__primary">
                <section className="contractor-job__section contractor-job__section--brief">
                  <h3>Description</h3>
                  <p>{ticket.description}</p>
                </section>

                <aside className="contractor-job__action-bar">
                  <h3>Update job</h3>
                  <div className="contractor-job__action-bar-row">
                    <label className="contractor-job__field">
                      <span>Status</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={saving}
                      >
                        {CONTRACTOR_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={saveStatus}
                      disabled={saving}
                    >
                      Save status
                    </button>
                  </div>
                </aside>
              </div>

              <div className="contractor-job__layout contractor-job__layout--evidence">
                <section className="contractor-job__panel">
                  <h3>Upload photo evidence</h3>
                  <label className="contractor-job__field">
                    <span>Type</span>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                      disabled={saving}
                    >
                      {EVIDENCE_KINDS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="contractor-job__field">
                    <span>Caption</span>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Leak at drain pan"
                      disabled={saving}
                    />
                  </label>
                  <label className="contractor-job__upload">
                    <span>{saving ? 'Uploading…' : 'Choose image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadEvidence}
                      disabled={saving}
                    />
                  </label>
                  <p className="contractor-job__hint">
                    Images under ~700KB are stored; larger files are saved as a labeled
                    placeholder for this demo.
                  </p>
                </section>

                <section className="contractor-job__panel contractor-job__panel--gallery">
                  <div className="contractor-job__section-head">
                    <h3>Photos / evidence</h3>
                    <span>{attachments.length}</span>
                  </div>
                  <TicketAttachments
                    attachments={attachments}
                    formatDate={formatDate}
                    onRemove={onRemoveEvidence}
                    saving={saving}
                    emptyMessage="No photos yet. Upload evidence next to this panel."
                  />
                </section>
              </div>

              <section className="contractor-job__panel contractor-job__panel--quote">
                <ContractorQuoteForm
                  partName={partName}
                  partQty={partQty}
                  partCost={partCost}
                  partNote={partNote}
                  setPartName={setPartName}
                  setPartQty={setPartQty}
                  setPartCost={setPartCost}
                  setPartNote={setPartNote}
                  onSubmit={submitPartQuote}
                  saving={saving}
                  quoteRequests={quoteRequests}
                  formatHkd={formatHkd}
                />
              </section>

              {actionError && (
                <p className="ticket-actions__feedback ticket-actions__feedback--error">
                  {actionError}
                </p>
              )}

              {chatOpen && (
                <div className="chat-popup" role="presentation">
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
                      selfActor={contractor}
                      suggestRole="contractor"
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
