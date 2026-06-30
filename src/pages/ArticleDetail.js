// ArticleDetail — a single promotional article.
import { Link, useParams } from 'react-router-dom';
import useFetch from '../lib/useFetch';
import Icon from '../components/Icon';
import SmartImage from '../components/SmartImage';
import { Loading, ErrorState } from '../components/States';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

function ArticleDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(`/api/content/articles/${slug}`);
  const a = data?.article;

  return (
    <article className="section section--last">
      <div className="container" style={{ maxWidth: 820 }}>
        <Link to="/articles" className="btn btn--ghost" style={{ marginBottom: 24 }}>
          <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /> All articles
        </Link>

        {loading && <Loading label="Loading article…" />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {a && (
          <>
            <p className="eyebrow">{formatDate(a.published_at)}{a.author ? ` · ${a.author}` : ''}</p>
            <h1 style={{ fontSize: 'clamp(30px,4.4vw,46px)', letterSpacing: '-.03em' }}>{a.title}</h1>
            {a.excerpt && <p className="muted mt-16" style={{ fontSize: 19 }}>{a.excerpt}</p>}
            {a.cover_image && (
              <SmartImage src={a.cover_image} alt={a.title} icon="chat"
                style={{ width: '100%', borderRadius: 'var(--r-panel)', margin: '28px 0', boxShadow: 'var(--shadow-md)', aspectRatio: '16/8', objectFit: 'cover' }} />
            )}
            <div style={{ fontSize: 17.5, lineHeight: 1.75, color: 'var(--ink)' }}>
              {a.body.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{ marginBottom: 20 }}>{para}</p>
              ))}
            </div>

            <div className="cta-band mt-32" style={{ padding: 36 }}>
              <h2 style={{ fontSize: 26 }}>Want to know more?</h2>
              <p>Our team is happy to talk through how this applies to your organisation.</p>
              <Link to="/contact" className="btn btn--white">Contact us <Icon name="arrow" size={15} /></Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default ArticleDetail;
