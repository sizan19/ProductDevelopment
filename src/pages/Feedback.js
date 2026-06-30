// Customer Feedback — testimonials with star ratings.
import useFetch from '../lib/useFetch';
import StarRating from '../components/StarRating';
import { Loading, ErrorState, EmptyState } from '../components/States';

function Feedback() {
  const { data, loading, error, reload } = useFetch('/api/content/feedback');
  const items = data?.feedback || [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Customer Feedback</span>
          <h1>What our clients think</h1>
          <p>Honest feedback and ratings from the organisations we have worked with.</p>

          {!loading && !error && items.length > 0 && (
            <div className="flex gap-12 items-center mt-16" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <div className="stat">
                <span className="stat__num">{data.averageRating?.toFixed(1)}</span>
                <span className="stat__label">Average rating</span>
              </div>
              <StarRating value={data.averageRating} />
              <span className="muted">· based on {data.count} review{data.count === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      </section>

      <section className="section section--last">
        <div className="container">
          {loading && <Loading label="Loading feedback…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && items.length === 0 && (
            <EmptyState title="No feedback yet" message="Reviews from our clients will appear here." icon="star" />
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid--2">
              {items.map((f) => (
                <article className="card card--rule" key={f.id}>
                  <div className="flex between items-center">
                    <StarRating value={f.rating} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>
                      {new Date(f.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="card__text mt-16" style={{ fontSize: 16, color: 'var(--ink)' }}>“{f.comment}”</p>
                  <p className="mono mt-16" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>
                    {f.customer_name}{f.company ? ` · ${f.company}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Feedback;
