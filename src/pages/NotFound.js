// 404 — unknown public route.
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="page-head section--last">
      <div className="container text-center">
        <span className="eyebrow">Error 404</span>
        <h1>Page not found</h1>
        <p className="muted" style={{ margin: '0 auto' }}>
          The page you are looking for doesn’t exist or has moved.
        </p>
        <div className="mt-24"><Link to="/" className="btn btn--primary">Back to home</Link></div>
      </div>
    </section>
  );
}

export default NotFound;
