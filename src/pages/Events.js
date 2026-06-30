// Upcoming Events — plus a section for past events for context.
import { useState } from 'react';
import useFetch from '../lib/useFetch';
import Icon from '../components/Icon';
import SmartImage from '../components/SmartImage';
import { Loading, ErrorState, EmptyState } from '../components/States';

function formatDate(d) {
  if (!d) return 'Date to be confirmed';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function EventCard({ e, upcoming }) {
  // Demo-only registration: no backend call, just visual confirmation.
  const [registered, setRegistered] = useState(false);

  return (
    <article className="card media-card card--hover" style={{ display: 'flex', flexDirection: 'column' }}>
      {e.cover_image && (
        <SmartImage src={e.cover_image} alt={e.title} icon="calendar" className="media-card__img" />
      )}
      <div className="media-card__body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="chips">
          <span className={`chip${upcoming ? '' : ' chip--muted'}`}>{upcoming ? 'Upcoming' : 'Past event'}</span>
        </div>
        <h2 className="card__title">{e.title}</h2>
        <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-dim)', display: 'flex', gap: 14, flexWrap: 'wrap', margin: '4px 0 12px' }}>
          <span className="flex items-center gap-8"><Icon name="calendar" size={13} /> {formatDate(e.event_date)}</span>
          {e.location && <span className="flex items-center gap-8"><Icon name="pin" size={13} /> {e.location}</span>}
        </p>
        {e.description && <p className="card__text">{e.description}</p>}

        {upcoming && (
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            {registered ? (
              <button type="button" className="btn btn--block" disabled style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                <Icon name="check" size={16} /> You're registered
              </button>
            ) : (
              <button type="button" className="btn btn--primary btn--block" onClick={() => setRegistered(true)}>
                Register for this event <Icon name="arrow" size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Events() {
  const { data, loading, error, reload } = useFetch('/api/content/events');
  const upcoming = data?.upcoming || [];
  const past = data?.past || [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Events</span>
          <h1>Where to find AI-Solutions</h1>
          <p>Join us at upcoming demos and workshops, register your interest, or see where we have been.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head--left"><span className="eyebrow">Upcoming</span><h2>Upcoming events</h2></div>
          {loading && <Loading label="Loading events…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && upcoming.length === 0 && (
            <EmptyState title="No upcoming events" message="Check back soon for new dates." icon="calendar" />
          )}
          {!loading && !error && upcoming.length > 0 && (
            <div className="grid grid--3">
              {upcoming.map((e) => <EventCard key={e.id} e={e} upcoming />)}
            </div>
          )}
        </div>
      </section>

      {!loading && !error && past.length > 0 && (
        <section className="section section--last">
          <div className="container">
            <div className="section-head section-head--left"><span className="eyebrow">Archive</span><h2>Past events</h2></div>
            <div className="grid grid--3">
              {past.map((e) => <EventCard key={e.id} e={e} upcoming={false} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Events;
