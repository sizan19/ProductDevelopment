// Accessible modal dialog: focus trap-lite, Esc to close, backdrop
// click to close, scroll lock. Used for the admin enquiry detail.
import { useEffect, useRef } from 'react';
import Icon from './Icon';

function Modal({ title, onClose, children, labelledById = 'modal-title' }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog for screen-reader + keyboard users.
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal__head">
          <h2 className="modal__title" id={labelledById}>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
