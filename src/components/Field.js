// Accessible form field wrappers: label + control + error/hint, all
// wired with htmlFor/id and aria-invalid/aria-describedby.
import { useId, useState } from 'react';
import Icon from './Icon';

export function TextField({
  label, name, value, onChange, error, hint, required, type = 'text',
  autoComplete, placeholder, icon,
}) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}{required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={`input${error ? ' input--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      {error && <span className="field__error" id={errId}>{error}</span>}
      {!error && hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function TextArea({ label, name, value, onChange, error, hint, required, rows = 5, placeholder }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}{required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className={`textarea${error ? ' textarea--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      {error && <span className="field__error" id={errId}>{error}</span>}
      {!error && hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function PasswordField({ label, value, onChange, error, required, autoComplete = 'current-password', placeholder }) {
  const id = useId();
  const errId = `${id}-err`;
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}{required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      <div className="password-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`input${error ? ' input--error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
        </button>
      </div>
      {error && <span className="field__error" id={errId}>{error}</span>}
    </div>
  );
}
