// Public site footer (dark).
import { Link } from 'react-router-dom';
import Brand from './Brand';

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__col">
          <Brand to="/" onDark />
          <p style={{ color: 'var(--dark-dim)', marginTop: 16, fontSize: 15, maxWidth: 320 }}>
            Innovating, promoting and delivering the future of the digital employee
            experience — with a strong focus on supporting people at work.
          </p>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/services">Services</Link>
          <Link to="/past-solutions">Past Solutions</Link>
          <Link to="/feedback">Customer Feedback</Link>
          <Link to="/articles">Articles</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <Link to="/gallery">Photo Gallery</Link>
          <Link to="/events">Upcoming Events</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/admin">Admin Portal</Link>
        </div>

        <div className="footer__col">
          <h4>Get in touch</h4>
          <a href="mailto:hello@ai-solutions.com">hello@ai-solutions.com</a>
          <span style={{ color: 'var(--dark-dim)', fontSize: 15, display: 'block', padding: '5px 0' }}>Sunderland, United Kingdom</span>
        </div>
      </div>
      <div className="footer__bottom">
        © {year} AI-Solutions Ltd · Built for CET333 Product Development
      </div>
    </footer>
  );
}

export default Footer;
