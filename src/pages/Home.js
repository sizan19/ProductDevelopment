// Home — company mission, core services and value proposition.
import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch';
import { IMAGES, serviceImage } from '../lib/images';
import Icon from '../components/Icon';
import StarRating from '../components/StarRating';
import SmartImage from '../components/SmartImage';

const VALUES = [
  { icon: 'spark', title: 'AI-first by design',
    text: 'An AI-powered virtual assistant sits at the core of everything we build, answering inquiries and accelerating work.' },
  { icon: 'bolt', title: 'Affordable & fast',
    text: 'Rapid, low-cost prototyping turns ideas into testable solutions in days — validate before you invest.' },
  { icon: 'globe', title: 'Built to scale globally',
    text: 'From a Sunderland start-up to worldwide impact: solutions engineered to grow across teams and industries.' },
];

const STATS = [
  { num: '24/7', label: 'AI assistant availability' },
  { num: '62%', label: 'Avg. faster resolution' },
  { num: 'Days', label: 'From idea to prototype' },
  { num: '4.8/5', label: 'Average client rating' },
];

const ASSISTANT_POINTS = [
  'Understands natural language and resolves routine requests automatically',
  'Knows when to hand a conversation to a human — gracefully',
  'Plugs into your existing tools to cut response times',
];

function Home() {
  const { data } = useFetch('/api/content/solutions');
  const { data: fb } = useFetch('/api/content/feedback');
  const solutions = (data?.solutions || []).slice(0, 3);
  const featured = (fb?.feedback || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="hero__pill"><b>New</b> AI virtual assistant for industry teams</span>
            <h1>The future of the <span className="accent">digital employee experience</span></h1>
            <p className="hero__lead">
              AI-Solutions helps industry teams work better. We build AI-powered virtual assistants
              and affordable prototypes that speed up design, engineering and innovation — with a
              strong focus on supporting people at work.
            </p>
            <div className="hero__actions">
              <Link to="/contact" className="btn btn--primary btn--big">Get in touch <Icon name="arrow" size={16} /></Link>
              <Link to="/services" className="btn btn--big">Explore services</Link>
            </div>
            <div className="hero__proof">
              <div className="hero__avatars" aria-hidden="true">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="" loading="lazy" />
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" loading="lazy" />
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" loading="lazy" />
                <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="" loading="lazy" />
              </div>
              <span>Trusted by teams in logistics, manufacturing, healthcare &amp; more</span>
            </div>
          </div>

          <div className="hero__media">
            <SmartImage src={IMAGES.heroTeam} alt="The AI-Solutions team collaborating" icon="robot" />
            <div className="hero__float hero__float--tl">
              <span className="icon-badge"><Icon name="spark" size={18} /></span>
              <span><b>AI Assistant</b><small>Always on, always learning</small></span>
            </div>
            <div className="hero__float hero__float--br">
              <span className="icon-badge"><Icon name="bolt" size={18} /></span>
              <span><b>Rapid prototypes</b><small>Idea → demo in days</small></span>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="logo-strip">
            <span className="logo-strip__label">Supporting people at work across industries</span>
            {['Logistics', 'Manufacturing', 'Healthcare', 'Retail', 'Insurance'].map((s) => (
              <span className="logo-strip__item" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / values */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our mission</span>
            <h2>Innovate, promote &amp; deliver — for people at work</h2>
            <p>We leverage AI to rapidly and proactively address the issues that impact the digital
              employee experience, so organisations can design, engineer and innovate faster.</p>
          </div>
          <div className="grid grid--3">
            {VALUES.map((v) => (
              <article className="card card--hover" key={v.title}>
                <div className="icon-badge"><Icon name={v.icon} size={22} /></div>
                <h3 className="card__title">{v.title}</h3>
                <p className="card__text">{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="section--tight">
        <div className="container">
          <div className="stats-band">
            {STATS.map((s) => (
              <div className="stats-band__item" key={s.label}>
                <div className="stats-band__num">{s.num}</div>
                <div className="stats-band__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase: AI assistant */}
      <section className="section">
        <div className="container">
          <div className="showcase">
            <div className="showcase__media">
              <SmartImage src={IMAGES.showcaseAssistant} alt="AI-powered virtual assistant" icon="robot" />
            </div>
            <div>
              <span className="eyebrow">Our core product</span>
              <h2 style={{ fontSize: 'clamp(26px,3.2vw,36px)' }}>An AI virtual assistant that actually helps</h2>
              <p className="muted mt-16" style={{ fontSize: 17 }}>
                Our flagship assistant responds to inquiries instantly and provides affordable,
                AI-based prototyping — the unique selling point that sets AI-Solutions apart.
              </p>
              <ul className="showcase__list">
                {ASSISTANT_POINTS.map((p) => (
                  <li key={p}><span className="tick"><Icon name="check" size={14} /></span> <span>{p}</span></li>
                ))}
              </ul>
              <div className="mt-32"><Link to="/services" className="btn btn--primary">See how it works <Icon name="arrow" size={15} /></Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="section section--tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What we do</span>
            <h2>Software solutions, built around you</h2>
            <p>From AI assistants to bespoke engineering — services grounded in what your team actually needs.</p>
          </div>
          <div className="grid grid--3">
            {solutions.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <div className="card skeleton" key={i} style={{ height: 320 }} />)
              : solutions.map((s) => (
                <article className="card media-card card--hover" key={s.id}>
                  <SmartImage src={serviceImage(s.icon)} alt={s.title} icon={s.icon || 'robot'} className="media-card__img" />
                  <div className="media-card__body">
                    <h3 className="card__title">{s.title}</h3>
                    <p className="card__text">{s.summary}</p>
                  </div>
                </article>
              ))}
          </div>
          <div className="text-center mt-32"><Link to="/services" className="btn">View all services <Icon name="arrow" size={15} /></Link></div>
        </div>
      </section>

      {/* Testimonials */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Customer feedback</span>
              <h2>Trusted by the teams we work with</h2>
            </div>
            <div className="grid grid--3">
              {featured.map((f) => (
                <article className="testimonial" key={f.id}>
                  <StarRating value={f.rating} />
                  <p className="testimonial__quote">“{f.comment}”</p>
                  <div className="testimonial__who">
                    <span className="avatar">{f.customer_name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                    <span>
                      <span className="testimonial__name" style={{ display: 'block' }}>{f.customer_name}</span>
                      <span className="testimonial__role">{f.company}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="text-center mt-32"><Link to="/feedback" className="btn">Read all feedback <Icon name="arrow" size={15} /></Link></div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section section--last">
        <div className="container">
          <div className="cta-band">
            <h2>Ready to support your people with AI?</h2>
            <p>Tell us about your project and our team will be in touch — no account needed.</p>
            <Link to="/contact" className="btn btn--white btn--big">Contact us <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
