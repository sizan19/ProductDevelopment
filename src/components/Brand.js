// Brand mark — mono wordmark + dark rounded "AI" square (DESIGN.md §Brand).
import { Link } from 'react-router-dom';

function Brand({ to = '/', onDark = false }) {
  const inner = (
    <span className="brand">
      <span className="brand__mark">AI</span>
      <span className="brand__word" style={onDark ? { color: 'var(--dark-fg)' } : undefined}>
        ai-<b>solutions</b>
      </span>
    </span>
  );
  if (!to) return inner;
  return (
    <Link to={to} aria-label="AI-Solutions home" style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  );
}

export default Brand;
