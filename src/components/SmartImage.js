// Image with a graceful branded fallback. If the remote image fails
// to load, we render a tinted placeholder with an icon instead of a
// broken-image glyph — keeping every card looking intentional.
import { useState } from 'react';
import Icon from './Icon';

function SmartImage({ src, alt, icon = 'spark', className = '', style }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={className}
        style={{ ...style, display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)' }}
        role="img"
        aria-label={alt}
      >
        <Icon name={icon} size={40} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default SmartImage;
