// Articles — promotional articles / news about the company (CSE requirement).
import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch';
import Icon from '../components/Icon';
import SmartImage from '../components/SmartImage';
import { Loading, ErrorState, EmptyState } from '../components/States';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

function Articles() {
  const { data, loading, error, reload } = useFetch('/api/content/articles');
  const articles = data?.articles || [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Articles</span>
          <h1>News &amp; insights from AI-Solutions</h1>
          <p>Ideas on AI, the digital employee experience and how we help teams innovate faster.</p>
        </div>
      </section>

      <section className="section section--last">
        <div className="container">
          {loading && <Loading label="Loading articles…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && articles.length === 0 && (
            <EmptyState title="No articles yet" message="Our latest articles will appear here." icon="chat" />
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="grid grid--3">
              {articles.map((a) => (
                <Link to={`/articles/${a.slug}`} className="card media-card card--hover" key={a.id} style={{ color: 'inherit' }}>
                  <SmartImage src={a.cover_image} alt={a.title} icon="chat" className="media-card__img" />
                  <div className="media-card__body">
                    <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                      {formatDate(a.published_at)}{a.author ? ` · ${a.author}` : ''}
                    </p>
                    <h2 className="card__title">{a.title}</h2>
                    <p className="card__text">{a.excerpt}</p>
                    <span className="mt-16" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                      Read article <Icon name="arrow" size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Articles;
