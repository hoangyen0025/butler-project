import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import { TicketLocationMap } from './TicketLocationMap';
import { buildFloorWalkRoute } from '../../utils/locationCoords';
import { formatSlaCountdown, priorityClass, statusClass } from '../../utils';
import '../ContractorPortal.css';

function SlaChip({ ticket }) {
  const sla = formatSlaCountdown(ticket);
  if (!sla) return null;
  return (
    <span className={`job-sla job-sla--${sla.tone}`} title={`Due ${ticket.dueDate}`}>
      {sla.text}
    </span>
  );
}

export function ContractorFloorWalk({ tickets, loading = false }) {
  const route = useMemo(() => buildFloorWalkRoute(tickets), [tickets]);
  const { nextStop, stops, floors, stopCount } = route;
  const nextSla = nextStop ? formatSlaCountdown(nextStop) : null;

  if (loading && tickets.length === 0) {
    return (
      <section className="floor-walk">
        <div className="floor-walk__head">
          <h3 className="floor-walk__title">Today&apos;s route</h3>
          <p className="floor-walk__subtitle">Building your floor walk…</p>
        </div>
      </section>
    );
  }

  if (stopCount === 0) {
    return (
      <section className="floor-walk">
        <div className="floor-walk__head">
          <h3 className="floor-walk__title">Today&apos;s route</h3>
          <p className="floor-walk__subtitle">
            No open jobs to walk — closed tickets stay off the route.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="floor-walk" aria-label="Today's floor walk route">
      <div className="floor-walk__head">
        <div>
          <h3 className="floor-walk__title">Today&apos;s route</h3>
          <p className="floor-walk__subtitle">
            {stopCount} open stop{stopCount !== 1 ? 's' : ''} · ordered by floor walk
            {floors.length > 0
              ? ` · ${floors.map((f) => f.floor).join(' → ')}`
              : ''}
          </p>
        </div>
      </div>

      {nextStop && (
        <Link
          to={`/contractor/jobs/${nextStop.id}`}
          className={`floor-walk__next${nextSla ? ` floor-walk__next--${nextSla.tone}` : ''}`}
        >
          <div className="floor-walk__next-label">
            <span>Next stop</span>
            <div className="floor-walk__next-right">
              <SlaChip ticket={nextStop} />
              <span className="floor-walk__next-floor">{nextStop.floor || '—'}</span>
            </div>
          </div>
          <h4 className="floor-walk__next-title">{nextStop.title}</h4>
          <p className="floor-walk__next-meta">
            #{nextStop.id}
            {nextStop.location ? ` · ${nextStop.location}` : ''}
          </p>
          <div className="floor-walk__next-badges">
            <Badge type={statusClass(nextStop.status)} value={nextStop.status} />
            <Badge
              type={priorityClass(nextStop.priority)}
              value={nextStop.priority}
            />
          </div>
        </Link>
      )}

      <ol className="floor-walk__stops">
        {stops.map((ticket, index) => {
          const isNext = index === 0;
          const sla = formatSlaCountdown(ticket);
          return (
            <li
              key={ticket.id}
              className={`floor-walk__stop${isNext ? ' is-next' : ''}${
                sla ? ` floor-walk__stop--${sla.tone}` : ''
              }`}
            >
              <span className="floor-walk__step" aria-hidden="true">
                {index + 1}
              </span>
              <Link
                to={`/contractor/jobs/${ticket.id}`}
                className="floor-walk__stop-body"
              >
                <div className="floor-walk__stop-top">
                  <strong>{ticket.floor || '—'}</strong>
                  <SlaChip ticket={ticket} />
                </div>
                <span className="floor-walk__stop-title">{ticket.title}</span>
                <span className="floor-walk__stop-loc">
                  {ticket.location || ticket.category}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <TicketLocationMap
        tickets={stops}
        pinMode="jobs"
        highlightId={nextStop?.id}
        title="Your stops on map"
        className="ticket-map--embedded"
      />
    </section>
  );
}
