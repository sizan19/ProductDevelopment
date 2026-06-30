// Public site navigation. Sticky, responsive (collapses < 760px),
// keyboard accessible, marks the active route.
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Brand from './Brand';
import Icon from './Icon';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/past-solutions', label: 'Past Solutions' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/articles', label: 'Articles' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Brand />

        <nav className={`nav__links${open ? ' is-open' : ''}`} aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
              onClick={close}
            >
              {l.label}
            </NavLink>
          ))}
          {/* Shown only inside the collapsed mobile menu */}
          <NavLink to="/contact" className="nav__link nav__link--mobile" onClick={close}>Contact</NavLink>
          <NavLink to="/admin" className="nav__link nav__link--mobile" onClick={close}>Admin</NavLink>
        </nav>

        <div className="nav__actions">
          <NavLink to="/admin" className="nav__admin">Admin</NavLink>
          <NavLink to="/contact" className="btn btn--primary">Contact Us</NavLink>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
