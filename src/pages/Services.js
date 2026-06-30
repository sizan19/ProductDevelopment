// Services — the software solutions AI-Solutions offers.
import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch';
import { IMAGES, serviceImage } from '../lib/images';
import Icon from '../components/Icon';
import SmartImage from '../components/SmartImage';
import { Loading, ErrorState, EmptyState } from '../components/States';

const STEPS = [
  { n: '01', title: 'Listen', text: 'We start with your needs — your workflows, your people, your goals.' },
  { n: '02', title: 'Prototype', text: 'We build an affordable, working prototype so you can test ideas fast.' },
  { n: '03', title: 'Deliver & scale', text: 'We refine, deploy and support the solution as it grows with you.' },
];

function Services() {
  const { data, loading, error, reload } = useFetch('/api/content/solutions');
  const solutions = data?.solutions || [];

  return (
    <>
      {/* Header with image */}
      <section className="hero">
        <div className="container">
          <div className="showcase">
            <div>
              <span className="eyebrow">Services</span>
              <h1 style={{ fontSize: 36, letterSpacing: '-0.6px', lineHeight: 1.12 }}>
                Software solutions that support people at work
              </h1>
              <p className="muted mt-16" style={{ fontSize: 17 }}>
                Each engagement is grounded in what you actually need. From AI virtual assistants to
                bespoke engineering, here is how we help teams design, build and innovate faster.
              </p>
              <div className="hero__actions mt-24">
                <Link to="/contact" className="btn btn--primary btn--big">Get a free consultation <Icon name="arrow" size={14} /></Link>
              </div>
            </div>
            <div className="showcase__media">
              <SmartImage src={IMAGES.showcasePrototype} alt="Planning a software solution" icon="code" />
            </div>
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="section">
        <div className="container">
          {loading && <Loading label="Loading services…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && solutions.length === 0 && (
            <EmptyState title="No services published yet" message="Please check back soon." icon="briefcase" />
          )}

          {!loading && !error && solutions.length > 0 && (
            <div className="grid grid--2">
              {solutions.map((s) => (
                <article className="card media-card card--hover" key={s.id}>
                  <SmartImage src={serviceImage(s.icon)} alt={s.title} icon={s.icon || 'robot'} className="media-card__img" />
                  <div className="media-card__body">
                    <div className="card__icon" style={{ marginBottom: 12 }}><Icon name={s.icon || 'robot'} size={20} /></div>
                    <h2 className="card__title">{s.title}</h2>
                    <p className="card__text" style={{ marginBottom: 12 }}>{s.summary}</p>
                    {s.description && <p className="card__text">{s.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How we work */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How we work</span>
            <h2>A simple path from idea to impact</h2>
          </div>
          <div className="grid grid--3">
            {STEPS.map((st) => (
              <article className="card card--rule" key={st.n}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{st.n}</span>
                <h3 className="card__title mt-8">{st.title}</h3>
                <p className="card__text">{st.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--last">
        <div className="container">
          <div className="cta-band">
            <h2>Not sure which solution fits?</h2>
            <p>Tell us your goals and we will recommend the right approach — no obligation.</p>
            <Link to="/contact" className="btn btn--white btn--big">Get in touch <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Services;
