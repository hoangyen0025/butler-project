import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateTime } from '../utils';
import './TicketChat.css';

const MESSAGE_TYPES = new Set(['note', 'message']);

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isMessage(entry) {
  return MESSAGE_TYPES.has(entry?.type);
}

function sortChronological(entries) {
  return [...entries].sort((a, b) => {
    const byAt = String(a.at || '').localeCompare(String(b.at || ''));
    if (byAt !== 0) return byAt;
    return 0;
  });
}

function initials(name) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isVoiceEntry(entry) {
  if (entry?.source === 'voice') return true;
  return /^site note:/i.test(String(entry?.text || '').trim());
}

function displayText(entry) {
  const text = String(entry?.text || '');
  if (isVoiceEntry(entry)) {
    return text.replace(/^site note:\s*/i, '');
  }
  return text;
}

/** Session kind for icons: voice | message | status | quote | checkin | assign | created | checklist | update */
function entryKind(entry) {
  if (isVoiceEntry(entry)) return 'voice';
  if (entry?.type === 'status') return 'status';
  if (entry?.type === 'quote') return 'quote';
  if (entry?.type === 'checkin') return 'checkin';
  if (entry?.type === 'assign') return 'assign';
  if (entry?.type === 'created') return 'created';
  if (entry?.type === 'checklist') return 'checklist';
  if (isMessage(entry)) return 'message';
  return 'update';
}

function SessionIcon({ kind }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (kind) {
    case 'voice':
      return (
        <svg {...common}>
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case 'status':
      return (
        <svg {...common}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case 'quote':
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'checkin':
      return (
        <svg {...common}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'assign':
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'created':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'checklist':
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'message':
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

const KIND_LABEL = {
  voice: 'Voice',
  message: 'Chat',
  status: 'Status',
  quote: 'Quote',
  checkin: 'Check-in',
  assign: 'Assign',
  created: 'Created',
  checklist: 'Checklist',
  update: 'Update',
};

export function TicketChat({
  ticketId,
  activity = [],
  selfActor = 'Dashboard User',
  suggestRole = 'desk',
  onSend,
  saving = false,
  disabled = false,
  title = 'Chat',
  enableVoice = false,
  voiceLang = 'en-HK',
  onClose,
  className = '',
}) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestHint, setSuggestHint] = useState(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [draftFromVoice, setDraftFromVoice] = useState(false);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const Recognition = getSpeechRecognition();
  const voiceSupported = enableVoice && Boolean(Recognition);

  const entries = useMemo(
    () => sortChronological(activity.filter(Boolean)),
    [activity]
  );

  const messageCount = entries.filter(isMessage).length;
  const canSuggest = Boolean(ticketId) && !disabled;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [entries.length, saving]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    setInterim('');
  };

  const startListening = () => {
    if (!voiceSupported || disabled || saving || suggesting) return;
    setSendError(null);
    setSuggestHint(null);

    const recognition = new Recognition();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || '';
        if (result.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) {
        setDraftFromVoice(true);
        setDraft((prev) =>
          `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${finalChunk.trim()}`
        );
      }
      setInterim(interimChunk);
    };

    recognition.onerror = (event) => {
      const code = event.error || 'unknown';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setSendError('Microphone permission blocked. Allow mic access and try again.');
      } else if (code === 'no-speech') {
        setSendError('No speech detected. Try again closer to the mic.');
      } else if (code !== 'aborted') {
        setSendError(`Voice capture failed (${code}).`);
      }
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setSendError('Could not start voice capture.');
      setListening(false);
    }
  };

  const toggleVoice = () => {
    if (listening) stopListening();
    else startListening();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || disabled || saving) return;
    const source = draftFromVoice ? 'voice' : undefined;
    stopListening();
    setSendError(null);
    setSuggestHint(null);
    try {
      await onSend(text, source ? { source } : undefined);
      setDraft('');
      setInterim('');
      setDraftFromVoice(false);
    } catch (err) {
      setSendError(err.message || 'Could not send message');
    }
  };

  const suggestReply = async () => {
    if (!canSuggest || suggesting || saving) return;
    stopListening();
    setSuggesting(true);
    setSendError(null);
    setSuggestHint(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: suggestRole, actor: selfActor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not suggest a reply');
      }
      if (!data.suggestion?.trim()) {
        throw new Error('No suggestion returned');
      }
      setDraftFromVoice(false);
      setDraft(data.suggestion.trim());
      if (data.source === 'fallback') {
        setSuggestHint(
          data.warning ||
            'Local draft (set OPENAI_API_KEY on the backend for AI replies). Edit before sending.'
        );
      } else {
        setSuggestHint('AI draft ready — edit if needed, then Send.');
      }
    } catch (err) {
      setSendError(err.message || 'Could not suggest a reply');
    } finally {
      setSuggesting(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const composerBusy = disabled || saving || suggesting;

  return (
    <section className={`ticket-chat${className ? ` ${className}` : ''}`} aria-label={title}>
      <div className="ticket-chat__head">
        <h3 className="ticket-chat__title">{title}</h3>
        <div className="ticket-chat__head-actions">
          <span className="ticket-chat__meta">
            {messageCount} message{messageCount !== 1 ? 's' : ''}
          </span>
          {onClose && (
            <button
              type="button"
              className="ticket-chat__close"
              onClick={onClose}
              aria-label="Close chat box"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="ticket-chat__list" ref={listRef} role="log" aria-live="polite">
        {entries.length === 0 ? (
          <p className="ticket-chat__empty">No messages yet. Start the thread below.</p>
        ) : (
          entries.map((entry, index) => {
            const kind = entryKind(entry);

            if (!isMessage(entry)) {
              return (
                <div
                  key={`sys-${entry.at}-${entry.type}-${index}`}
                  className={`ticket-chat__system ticket-chat__system--${kind}`}
                >
                  <span className="ticket-chat__session-icon" title={KIND_LABEL[kind]}>
                    <SessionIcon kind={kind} />
                  </span>
                  <span>{entry.text}</span>
                  <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                </div>
              );
            }

            const mine = entry.actor === selfActor;
            return (
              <div
                key={`msg-${entry.at}-${index}`}
                className={`ticket-chat__row${mine ? ' ticket-chat__row--mine' : ''}${
                  kind === 'voice' ? ' ticket-chat__row--voice' : ''
                }`}
              >
                {!mine && (
                  <span className="ticket-chat__avatar" aria-hidden="true">
                    {initials(entry.actor)}
                  </span>
                )}
                <div className={`ticket-chat__bubble ticket-chat__bubble--${kind}`}>
                  <div className="ticket-chat__bubble-top">
                    <span className="ticket-chat__actor">
                      <span
                        className={`ticket-chat__session-icon ticket-chat__session-icon--${kind}`}
                        title={KIND_LABEL[kind]}
                      >
                        <SessionIcon kind={kind} />
                      </span>
                      {mine ? 'You' : entry.actor || 'Unknown'}
                      {kind === 'voice' && (
                        <span className="ticket-chat__kind-tag">Voice</span>
                      )}
                    </span>
                    <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                  </div>
                  <p className="ticket-chat__text">{displayText(entry)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ticket-chat__composer">
        <div
          className={`ticket-chat__compose-row${
            voiceSupported ? ' ticket-chat__compose-row--with-mic' : ''
          }`}
        >
          {voiceSupported && (
            <button
              type="button"
              className={`ticket-chat__mic${listening ? ' is-listening' : ''}`}
              onClick={toggleVoice}
              disabled={composerBusy}
              aria-pressed={listening}
              title={listening ? 'Stop voice dictation' : 'Dictate with microphone'}
            >
              <SessionIcon kind="voice" />
              <span className="visually-hidden">
                {listening ? 'Stop listening' : 'Start voice dictation'}
              </span>
            </button>
          )}
          <label className="ticket-chat__field">
            <span className="visually-hidden">New message</span>
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setDraftFromVoice(false);
                setSuggestHint(null);
              }}
              onKeyDown={onKeyDown}
              placeholder={
                enableVoice
                  ? 'Type a message or use the mic…'
                  : 'Write a message… (Enter to send)'
              }
              disabled={composerBusy}
            />
          </label>
        </div>
        <div className="ticket-chat__toolbar">
          <div className="ticket-chat__toolbar-left">
            {listening && (
              <span className="ticket-chat__listening" aria-live="polite">
                Listening{interim ? `: ${interim}` : '…'}
              </span>
            )}
            {draftFromVoice && !listening && (
              <span className="ticket-chat__draft-voice">
                <SessionIcon kind="voice" />
                Voice draft
              </span>
            )}
            {enableVoice && !voiceSupported && (
              <span className="ticket-chat__voice-unsupported" title="Needs Chrome or Edge">
                Voice unavailable
              </span>
            )}
          </div>
          <div className="ticket-chat__actions">
            {canSuggest && (
              <button
                type="button"
                className="btn btn--outline ticket-chat__suggest"
                onClick={suggestReply}
                disabled={composerBusy}
                title="Draft a reply from ticket context"
              >
                {suggesting ? 'Drafting…' : 'Suggest'}
              </button>
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={send}
              disabled={composerBusy || !draft.trim()}
            >
              {saving ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
      {suggestHint && !sendError && !listening && (
        <p className="ticket-chat__hint" role="status">
          {suggestHint}
        </p>
      )}
      {sendError && (
        <p className="ticket-chat__error" role="alert">
          {sendError}
        </p>
      )}
    </section>
  );
}
