// Shared async UI states: Loading, Empty, Error.
// Every asynchronous view uses these for consistent UX.
import Icon from './Icon';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" />
      <p className="mt-16 muted">{label}</p>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message = '', icon = 'inbox', children }) {
  return (
    <div className="state">
      <Icon name={icon} size={28} />
      <p className="state__title">{title}</p>
      {message && <p className="muted">{message}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state" role="alert">
      <Icon name="refresh" size={28} />
      <p className="state__title">We hit a problem</p>
      <p className="muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn mt-16" onClick={onRetry}>
          <Icon name="refresh" size={14} /> Try again
        </button>
      )}
    </div>
  );
}
