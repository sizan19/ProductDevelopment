// Photo Gallery — images from past & upcoming promotional events,
// with an accessible lightbox.
import { useState } from 'react';
import useFetch from '../lib/useFetch';
import Modal from '../components/Modal';
import { Loading, ErrorState, EmptyState } from '../components/States';

function Gallery() {
  const { data, loading, error, reload } = useFetch('/api/content/gallery');
  const images = data?.gallery || [];
  const [active, setActive] = useState(null);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Photo Gallery</span>
          <h1>Moments from our events</h1>
          <p>A look back at our promotional events, demos and the people behind AI-Solutions.</p>
        </div>
      </section>

      <section className="section section--last">
        <div className="container">
          {loading && <Loading label="Loading gallery…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && images.length === 0 && (
            <EmptyState title="No photos yet" message="Event photos will appear here." icon="globe" />
          )}

          {!loading && !error && images.length > 0 && (
            <div className="gallery">
              {images.map((img) => (
                <button
                  type="button"
                  className="gallery__item"
                  key={img.id}
                  onClick={() => setActive(img)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: 0, border: '1px solid var(--border)', cursor: 'zoom-in', background: 'var(--card)' }}
                  aria-label={`View photo: ${img.caption || 'event photo'}`}
                >
                  <img src={img.image_url} alt={img.caption || 'Event photo'} loading="lazy" />
                  {(img.caption || img.event_title) && (
                    <span className="gallery__cap" style={{ display: 'block' }}>
                      {img.caption}{img.event_title ? ` · ${img.event_title}` : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <Modal title={active.caption || 'Event photo'} onClose={() => setActive(null)}>
          <img src={active.image_url} alt={active.caption || 'Event photo'} style={{ borderRadius: 8, width: '100%' }} />
          {active.event_title && <p className="muted mt-16 mono" style={{ fontSize: 12 }}>{active.event_title}</p>}
        </Modal>
      )}
    </>
  );
}

export default Gallery;
