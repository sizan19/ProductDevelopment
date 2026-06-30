// Past Solutions — case studies of completed industry projects.
import useFetch from '../lib/useFetch';
import { Loading, ErrorState, EmptyState } from '../components/States';

function PastSolutions() {
  const { data, loading, error, reload } = useFetch('/api/content/case-studies');
  const items = data?.caseStudies || [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Past Solutions</span>
          <h1>Real results, delivered for industry</h1>
          <p>Highlights of past solutions we have provided — and the measurable outcomes they produced.</p>
        </div>
      </section>

      <section className="section section--last">
        <div className="container">
          {loading && <Loading label="Loading case studies…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && items.length === 0 && (
            <EmptyState title="No case studies yet" message="Our completed projects will appear here." icon="briefcase" />
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid--3">
              {items.map((c) => (
                <article className="card media-card card--hover" key={c.id}>
                  {c.image_url && (
                    <img className="media-card__img" src={c.image_url} alt={`${c.client || c.title} project`} loading="lazy" />
                  )}
                  <div className="media-card__body">
                    <div className="chips">
                      {c.industry && <span className="chip">{c.industry}</span>}
                      {c.client && <span className="chip chip--muted">{c.client}</span>}
                    </div>
                    <h2 className="card__title">{c.title}</h2>
                    <p className="card__text" style={{ marginBottom: 10 }}>{c.summary}</p>
                    {c.outcome && (
                      <p className="card__text" style={{ color: 'var(--ink)' }}>
                        <strong>Outcome:</strong> {c.outcome}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default PastSolutions;
