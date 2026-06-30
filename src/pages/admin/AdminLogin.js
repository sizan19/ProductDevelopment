// Admin login — integrates with the EXISTING secure backend:
//   1) POST /api/auth/login   (email + password + Turnstile) → sends OTP
//   2) POST /api/auth/verify-otp (userId + 6-digit OTP)       → sets session
// No auth/security logic is reimplemented here; this is just the UI.
import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { postJSON } from '../../api';
import { TextField, PasswordField } from '../../components/Field';
import Turnstile from '../../components/Turnstile';
import Brand from '../../components/Brand';
import Icon from '../../components/Icon';

function AdminLogin() {
  const [step, setStep] = useState('credentials'); // credentials | otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const turnstileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/admin';

  const resetCaptcha = () => { turnstileRef.current?.reset(); setToken(''); };

  const submitCredentials = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Please complete the CAPTCHA challenge.'); return; }
    setBusy(true);
    try {
      const data = await postJSON('/api/auth/login', { email, password, turnstileToken: token });
      if (data.requireOTP) {
        setUserId(data.userId);
        setStep('otp');
        setInfo(data.message || 'We sent a 6-digit code to your email.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
      resetCaptcha();
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await postJSON('/api/auth/verify-otp', { userId, otp });
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid code.');
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError(''); setInfo('');
    try {
      const data = await postJSON('/api/auth/request-otp', { userId });
      setInfo(data.message || 'A new code has been sent.');
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__head">
          <Brand to={null} />
          <h1 className="mt-16">Admin Portal</h1>
          <p>{step === 'credentials' ? 'Sign in to review customer enquiries.' : 'Enter the verification code we emailed you.'}</p>
        </div>

        {error && <div className="notice notice--error" role="alert">{error}</div>}
        {info && step === 'otp' && <div className="notice notice--info">{info}</div>}

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} noValidate>
            <TextField label="Email" required type="email" value={email} onChange={setEmail} autoComplete="username" />
            <PasswordField label="Password" required value={password} onChange={setPassword} />
            <div className="field">
              <span className="field__label">Verification</span>
              <Turnstile ref={turnstileRef} onToken={setToken} />
            </div>
            <button type="submit" className="btn btn--primary btn--big btn--block" disabled={busy}>
              {busy ? (<><span className="spinner spinner--sm" /> Signing in…</>) : (<>Continue <Icon name="arrow" size={14} /></>)}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} noValidate>
            <TextField label="6-digit code" required value={otp} onChange={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••" autoComplete="one-time-code" />
            <button type="submit" className="btn btn--primary btn--big btn--block" disabled={busy || otp.length !== 6}>
              {busy ? (<><span className="spinner spinner--sm" /> Verifying…</>) : 'Verify & sign in'}
            </button>
            <div className="flex between mt-16">
              <button type="button" className="btn btn--ghost" onClick={() => { setStep('credentials'); setOtp(''); resetCaptcha(); }}>Back</button>
              <button type="button" className="btn btn--ghost" onClick={resendOtp}>Resend code</button>
            </div>
          </form>
        )}

        <p className="auth-card__foot"><Link to="/">← Back to website</Link></p>
      </div>
    </div>
  );
}

export default AdminLogin;
