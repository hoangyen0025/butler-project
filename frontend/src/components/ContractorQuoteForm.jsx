export function ContractorQuoteForm({
  partName,
  partQty,
  partCost,
  partNote,
  setPartName,
  setPartQty,
  setPartCost,
  setPartNote,
  onSubmit,
  saving,
  quoteRequests = [],
  formatHkd,
}) {
  return (
    <>
      <h3>Parts &amp; quote request</h3>
      <p className="contractor-job__hint">
        Request a part with estimated cost. Staff approve it on the ticket before
        it is added to the estimate.
      </p>
      <form className="quote-form" onSubmit={onSubmit}>
        <label className="contractor-job__field">
          <span>Part / material</span>
          <input
            type="text"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder="e.g. Condensate drain kit"
            disabled={saving}
            required
          />
        </label>
        <div className="quote-form__row">
          <label className="contractor-job__field">
            <span>Qty</span>
            <input
              type="number"
              min="1"
              step="1"
              value={partQty}
              onChange={(e) => setPartQty(e.target.value)}
              disabled={saving}
              required
            />
          </label>
          <label className="contractor-job__field">
            <span>Est. unit cost (HKD)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={partCost}
              onChange={(e) => setPartCost(e.target.value)}
              placeholder="0"
              disabled={saving}
              required
            />
          </label>
        </div>
        <label className="contractor-job__field">
          <span>Note (optional)</span>
          <input
            type="text"
            value={partNote}
            onChange={(e) => setPartNote(e.target.value)}
            placeholder="Why this part is needed"
            disabled={saving}
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Sending…' : 'Send for approval'}
        </button>
      </form>

      {quoteRequests.length > 0 && (
        <ul className="quote-list">
          {[...quoteRequests].reverse().map((quote) => (
            <li
              key={quote.id}
              className={`quote-list__item quote-list__item--${quote.status}`}
            >
              <div className="quote-list__top">
                <strong>{quote.partName}</strong>
                <span className={`quote-status quote-status--${quote.status}`}>
                  {quote.status}
                </span>
              </div>
              <p className="quote-list__meta">
                × {quote.qty} · {formatHkd(quote.unitCost)} ea ·{' '}
                {formatHkd(quote.estimatedTotal)}
                {quote.note ? ` · ${quote.note}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
