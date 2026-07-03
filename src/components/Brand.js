// Brand mark — the AI-Solutions logo lockup (public/logo-lockup.png).
// On dark surfaces it sits on a light rounded plate so it stays legible.
import { Link } from 'react-router-dom';

function Brand({ to = '/', onDark = false }) {
  const img = (
    <img
      src={`${process.env.PUBLIC_URL}/logo-lockup.png`}
      alt="AI-Solutions"
      className={`brand__logo${onDark ? ' brand__logo--plate' : ''}`}
      width="128"
      height="45"
    />
  );

  if (!to) return img;
  return (
    <Link to={to} className="brand" aria-label="AI-Solutions home">
      {img}
    </Link>
  );
}

export default Brand;
