// ============================================================
// seed.js — Seed the AI-Solutions database
// ============================================================
// Creates the single admin account (there is no public sign-up)
// and loads sample public website content so every page renders.
//
// Run from the backend folder:   node seed.js
// Idempotent: re-running resets sample content and upserts admin.
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = require('./db');
const { generateSalt, hashPassword } = require('./utils/hash');

// ---- Default admin credentials (change after first login) ----
const ADMIN = {
  username: 'admin',
  email:    process.env.SEED_ADMIN_EMAIL    || 'admin@ai-solutions.com',
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@2026!',
};

const solutions = [
  { title: 'AI Virtual Assistants & Chatbots', icon: 'robot', sort_order: 1,
    summary: 'Conversational AI that handles routine customer and employee queries 24/7 and escalates to a human when needed.',
    description: 'We design and deploy AI assistants — built on large language models with retrieval-augmented generation — that answer questions from your own knowledge base, automate common requests such as order tracking or IT password resets, and hand over to a human agent with full context when a query is complex or sensitive.' },
  { title: 'Intelligent Document Processing', icon: 'code', sort_order: 2,
    summary: 'Extract, classify and validate data from invoices, forms and contracts automatically using OCR and NLP.',
    description: 'Manual data entry is slow and error-prone. Our document-processing pipelines combine optical character recognition with natural-language models to read structured and unstructured documents, extract the fields that matter, and push clean data straight into your finance or back-office systems.' },
  { title: 'Predictive Analytics & Forecasting', icon: 'chart', sort_order: 3,
    summary: 'Machine-learning models for demand forecasting, churn prediction and predictive maintenance.',
    description: 'We build and validate models on your historical data to forecast demand, anticipate equipment failures before they happen, and flag customers at risk of churning — turning the data you already collect into decisions you can act on.' },
  { title: 'Process Automation (RPA + AI)', icon: 'bolt', sort_order: 4,
    summary: 'Automate repetitive, rules-based workflows and augment them with AI judgement.',
    description: 'By combining robotic process automation with AI decisioning, we remove the repetitive digital tasks that slow teams down — from onboarding and approvals to reconciliation — freeing people to focus on work that needs human judgement.' },
  { title: 'Computer Vision & Quality Inspection', icon: 'spark', sort_order: 5,
    summary: 'Automated visual inspection and image recognition for manufacturing and operations.',
    description: 'Our computer-vision solutions detect defects on production lines, read labels and serial numbers, and monitor sites in real time, delivering consistent quality checks at a speed and scale that manual inspection cannot match.' },
];

const caseStudies = [
  { title: 'AI service-desk assistant deflecting routine IT tickets', client: 'A national logistics operator', industry: 'Logistics',
    summary: 'An AI virtual assistant was integrated into the internal IT service desk to handle password resets, system access requests, status updates and "how-to" questions for depot and driver staff.',
    outcome: 'A large share of tier-1 requests were resolved automatically without an agent, with anything complex escalated to the support team with full context — reducing wait times for staff and freeing agents for higher-value work.',
    image_url: 'https://picsum.photos/seed/logistics/800/500' },
  { title: 'Predictive maintenance reducing unplanned downtime', client: 'A precision manufacturer', industry: 'Manufacturing',
    summary: 'Machine-learning models were trained on sensor and maintenance data to predict equipment failures on a production line before they occurred.',
    outcome: 'Early-warning alerts allowed maintenance to be scheduled proactively rather than reactively, cutting unplanned downtime and extending the working life of critical machinery.',
    image_url: 'https://picsum.photos/seed/factory/800/500' },
  { title: 'Automated claims intake with intelligent document processing', client: 'A regional insurer', industry: 'Insurance',
    summary: 'OCR and natural-language models were used to read incoming claim forms and supporting documents and extract the data needed to open and triage a case.',
    outcome: 'Claims that previously required manual keying were processed in minutes, improving turnaround times while handlers focused on assessment rather than data entry.',
    image_url: 'https://picsum.photos/seed/insurance/800/500' },
  { title: 'Demand forecasting to improve stock availability', client: 'A multi-site retailer', industry: 'Retail',
    summary: 'A forecasting model combined sales history, seasonality and promotional calendars to predict demand at store and product level.',
    outcome: 'More accurate forecasts reduced both stockouts and overstock, improving on-shelf availability while lowering the working capital tied up in inventory.',
    image_url: 'https://picsum.photos/seed/retail/800/500' },
];

const feedback = [
  { customer_name: 'Sarah Whitfield', company: 'National logistics operator', rating: 5,
    comment: 'Their AI service-desk assistant handles the routine questions our team used to drown in, and the hand-off to a human is genuinely seamless. Delivered faster than we expected.' },
  { customer_name: 'David Olsen', company: 'Precision manufacturer', rating: 5,
    comment: 'The predictive-maintenance models have already flagged issues before they became failures. Pragmatic, expert and easy to work with.' },
  { customer_name: 'Priya Nair', company: 'Regional insurer', rating: 4,
    comment: 'Automating our claims intake removed a huge amount of manual data entry. A few tweaks were needed but support was excellent throughout.' },
  { customer_name: 'Marcus Lee', company: 'Multi-site retailer', rating: 5,
    comment: 'Demand forecasting finally gave us a real handle on stock. On-shelf availability is up and we are holding far less dead inventory.' },
  { customer_name: 'Elena Costa', company: 'Customer services team', rating: 4,
    comment: 'Professional, responsive and genuinely invested in our success. The chatbot has noticeably cut our call volume.' },
];

const articles = [
  { slug: 'ai-assistants-it-service-desks', title: 'How AI Virtual Assistants Are Transforming IT Service Desks',
    excerpt: 'A look at how conversational AI is deflecting routine tickets and improving employee support in real organisations.',
    cover_image: 'https://picsum.photos/seed/servicedesk/800/450',
    body: 'The IT service desk is one of the most common — and most successful — places organisations deploy AI today. A large proportion of the requests that reach a service desk are repetitive: password resets, software access, "how do I…" questions and status updates.\n\nModern AI assistants, built on large language models connected to a company\'s own knowledge base, can resolve many of these requests instantly and around the clock. Crucially, a well-designed assistant recognises the limits of what it can safely answer and escalates to a human agent — with the full conversation history attached — whenever a request is complex, sensitive or unusual.\n\nThe result is not the removal of human agents but the redirection of their time: routine volume is absorbed by the assistant, while skilled staff focus on the incidents that genuinely need them. This is the model AI-Solutions builds towards for every assistant we deliver.' },
  { slug: 'predictive-maintenance-machine-learning', title: 'Predictive Maintenance: Using Machine Learning to Cut Downtime',
    excerpt: 'How manufacturers use sensor data and machine learning to fix equipment before it breaks.',
    cover_image: 'https://picsum.photos/seed/maintenance/800/450',
    body: 'Unplanned downtime is one of the largest hidden costs in manufacturing. Traditional maintenance is either reactive — fixing machines after they fail — or calendar-based, replacing parts on a fixed schedule whether they need it or not.\n\nPredictive maintenance takes a different approach. By training machine-learning models on the data that equipment already produces — vibration, temperature, current draw and error logs — it becomes possible to detect the subtle patterns that precede a failure and to act before the breakdown happens.\n\nIn practice this means maintenance can be scheduled at the right moment: late enough to get full value from a component, early enough to avoid an unplanned stoppage. For the manufacturers we work with, that balance translates directly into higher output and lower cost.' },
  { slug: 'intelligent-document-processing-finance', title: 'Intelligent Document Processing in Financial Services',
    excerpt: 'Turning invoices, forms and contracts into clean data with OCR and natural-language AI.',
    cover_image: 'https://picsum.photos/seed/documents/800/450',
    body: 'Financial services run on documents — invoices, claims, statements, contracts and forms — and historically much of that information has been moved into systems by hand. Manual keying is slow, expensive and prone to error.\n\nIntelligent document processing combines optical character recognition, which converts images of text into machine-readable characters, with natural-language models that understand context. Together they can locate and extract the specific fields a process needs, validate them against business rules, and route anything uncertain to a person for review.\n\nThe pattern is widely applicable: accounts-payable automation, claims intake, customer onboarding and compliance checks all benefit. The goal is straightforward — let software handle the predictable extraction work, and let people handle the judgement.' },
  { slug: 'rag-enterprise-knowledge', title: 'Retrieval-Augmented Generation: Grounding AI in Your Own Data',
    excerpt: 'Why RAG is the practical way to make AI assistants accurate and trustworthy for business use.',
    cover_image: 'https://picsum.photos/seed/rag/800/450',
    body: 'Large language models are powerful, but on their own they can answer confidently from general knowledge that may be out of date or simply wrong for your business. Retrieval-augmented generation, or RAG, is the technique that addresses this.\n\nInstead of relying only on the model\'s memory, a RAG system first retrieves the most relevant passages from a trusted source — your documentation, policies or product data — and gives them to the model as context when it answers. The response is therefore grounded in your own, current information, and can cite where it came from.\n\nFor organisations, this is the difference between an interesting demo and a system they can rely on. It is the foundation of the AI assistants AI-Solutions deploys, because accuracy and trust matter more than novelty.' },
];

// event_date stored as YYYY-MM-DD; is_upcoming controls the page it appears on.
const events = [
  { title: 'AI for the Workplace — Sunderland Summit', location: 'Sunderland Software Centre',
    event_date: '2026-09-18', is_upcoming: true,
    description: 'A half-day summit exploring practical AI adoption for regional employers, featuring live demos of our virtual assistant.',
    cover_image: 'https://picsum.photos/seed/summit/800/500' },
  { title: 'Hands-on Prototyping Workshop', location: 'Online (Webinar)',
    event_date: '2026-07-30', is_upcoming: true,
    description: 'A free interactive workshop showing how to take an idea to a working prototype using AI-assisted tooling.',
    cover_image: 'https://picsum.photos/seed/workshop/800/500' },
  { title: 'North East Tech Expo 2026', location: 'Newcastle Exhibition Centre',
    event_date: '2026-03-12', is_upcoming: false,
    description: 'We showcased our latest digital employee experience tooling to over 400 visitors at the region’s flagship technology expo.',
    cover_image: 'https://picsum.photos/seed/expo/800/500' },
  { title: 'Innovation Showcase Evening', location: 'Sunderland City Hall',
    event_date: '2025-11-20', is_upcoming: false,
    description: 'An evening demonstrating real industry solutions delivered by AI-Solutions, with talks from our client partners.',
    cover_image: 'https://picsum.photos/seed/showcase/800/500' },
];

// Gallery images keyed to the past events by index after insert.
const galleryFor = (pastEventIds) => ([
  { event_idx: 0, image_url: 'https://picsum.photos/seed/g1/600/400', caption: 'Our stand at the North East Tech Expo' },
  { event_idx: 0, image_url: 'https://picsum.photos/seed/g2/600/400', caption: 'Live virtual assistant demo' },
  { event_idx: 1, image_url: 'https://picsum.photos/seed/g3/600/400', caption: 'Client partner talk at the Innovation Showcase' },
  { event_idx: 1, image_url: 'https://picsum.photos/seed/g4/600/400', caption: 'Networking at Sunderland City Hall' },
  { event_idx: 0, image_url: 'https://picsum.photos/seed/g5/600/400', caption: 'The AI-Solutions team' },
  { event_idx: 1, image_url: 'https://picsum.photos/seed/g6/600/400', caption: 'Prototyping in action' },
].map(g => ({ ...g, event_id: pastEventIds[g.event_idx] || null })));

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---- Admin (upsert) ----
    const hash = hashPassword(ADMIN.password, generateSalt());
    await client.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, password_changed_at)
       VALUES ($1, $2, $3, 'admin', true, NOW())
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = 'admin',
             email_verified = true,
             failed_attempts = 0,
             locked_until = NULL`,
      [ADMIN.username, ADMIN.email, hash]
    );

    // ---- Reset + load sample content ----
    await client.query('TRUNCATE solutions, case_studies, feedback, articles, gallery_images, events RESTART IDENTITY CASCADE');

    for (const s of solutions) {
      await client.query(
        `INSERT INTO solutions (title, summary, description, icon, sort_order, is_active)
         VALUES ($1,$2,$3,$4,$5,true)`,
        [s.title, s.summary, s.description, s.icon, s.sort_order]
      );
    }

    for (const c of caseStudies) {
      await client.query(
        `INSERT INTO case_studies (title, client, industry, summary, outcome, image_url)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [c.title, c.client, c.industry, c.summary, c.outcome, c.image_url]
      );
    }

    for (const f of feedback) {
      await client.query(
        `INSERT INTO feedback (customer_name, company, rating, comment, is_published)
         VALUES ($1,$2,$3,$4,true)`,
        [f.customer_name, f.company, f.rating, f.comment]
      );
    }

    for (const a of articles) {
      await client.query(
        `INSERT INTO articles (slug, title, excerpt, body, cover_image, is_published, published_at)
         VALUES ($1,$2,$3,$4,$5,true,NOW())`,
        [a.slug, a.title, a.excerpt, a.body, a.cover_image]
      );
    }

    const pastEventIds = [];
    for (const e of events) {
      const r = await client.query(
        `INSERT INTO events (title, description, location, event_date, is_upcoming, cover_image)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, is_upcoming`,
        [e.title, e.description, e.location, e.event_date, e.is_upcoming, e.cover_image]
      );
      if (!r.rows[0].is_upcoming) pastEventIds.push(r.rows[0].id);
    }

    for (const g of galleryFor(pastEventIds)) {
      await client.query(
        `INSERT INTO gallery_images (event_id, image_url, caption) VALUES ($1,$2,$3)`,
        [g.event_id, g.image_url, g.caption]
      );
    }

    await client.query('COMMIT');

    console.log('\n  AI-Solutions database seeded successfully.');
    console.log('  --------------------------------------------');
    console.log(`  Admin login:  ${ADMIN.email}`);
    console.log(`  Password:     ${ADMIN.password}`);
    console.log('  (Change this after your first login.)\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n  Seed failed:', err.message, '\n');
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
