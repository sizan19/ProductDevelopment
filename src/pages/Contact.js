// Contact Us — the 7-field enquiry form. No customer account required.
// Client-side validation mirrors the server rules; submission is
// protected by Cloudflare Turnstile and posts to /api/contact.
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { postJSON } from '../api';
import { TextField, TextArea } from '../components/Field';
import Turnstile from '../components/Turnstile';
import Icon from '../components/Icon';

const EMPTY = {
  full_name: '', email: '', phone: '', company: '',
  country: '', job_title: '', job_details: '',
};

function validate(values) {
  const e = {};
  if (!values.full_name.trim()) e.full_name = 'Please enter your full name.';
  if (!values.email.trim()) e.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) e.email = 'Please enter a valid email address.';
  if (values.phone && values.phone.length > 40) e.phone = 'Phone number is too long.';
  if (!values.job_details.trim()) e.job_details = 'Please tell us about your requirements.';
  else if (values.job_details.trim().length < 5) e.job_details = 'Please add a little more detail (5+ characters).';
  return e;
}

function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [serverError, setServerError] = useState('');
  const turnstileRef = useRef(null);

  const set = (key) => (val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const v = validate(values);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    if (!token) {
      setServerError('Please complete the CAPTCHA challenge below.');
      return;
    }

    setStatus('submitting');
    try {
      await postJSON('/api/contact', { ...values, turnstileToken: token });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setServerError(err.message || 'Could not send your message. Please try again.');
      turnstileRef.current?.reset();
      setToken('');
    }
  };

  if (status === 'success') {
    return (
      <section className="page-head">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="card card--rule" role="status">
            <div className="card__icon"><Icon name="check" size={20} /></div>
            <h1 style={{ fontSize: 26 }}>Thank you — your enquiry is in.</h1>
            <p className="muted mt-8">
              Our team will review your requirements and get back to you shortly. We have not created
              an account for you — there is nothing else you need to do.
            </p>
            <div className="flex gap-12 mt-24 wrap">
              <Link to="/" className="btn btn--primary">Back to home</Link>
              <button type="button" className="btn" onClick={() => { setValues(EMPTY); setToken(''); setStatus('idle'); }}>
                Send another enquiry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">Contact Us</span>
          <h1>Tell us about your project</h1>
          <p>
            Share your requirements and our team will be in touch. No account or password needed —
            just the details below.
          </p>
        </div>
      </section>

      <section className="section section--last">
        <div className="container" style={{ maxWidth: 720 }}>
          <form className="card" onSubmit={handleSubmit} noValidate>
            {serverError && <div className="notice notice--error" role="alert">{serverError}</div>}

            <div className="grid grid--2" style={{ gap: '0 20px' }}>
              <TextField label="Full Name" required value={values.full_name} onChange={set('full_name')}
                error={errors.full_name} autoComplete="name" />
              <TextField label="Email Address" required type="email" value={values.email} onChange={set('email')}
                error={errors.email} autoComplete="email" />
              <TextField label="Phone Number" type="tel" value={values.phone} onChange={set('phone')}
                error={errors.phone} autoComplete="tel" />
              <TextField label="Company Name" value={values.company} onChange={set('company')}
                autoComplete="organization" />
              <TextField label="Country" value={values.country} onChange={set('country')}
                autoComplete="country-name" />
              <TextField label="Job Title" value={values.job_title} onChange={set('job_title')}
                autoComplete="organization-title" />
            </div>

            <TextArea label="Job Details" required rows={6} value={values.job_details} onChange={set('job_details')}
              error={errors.job_details}
              placeholder="Describe what you would like help with — your goals, timescales and anything else we should know." />

            <div className="field">
              <span className="field__label">Verification</span>
              <Turnstile ref={turnstileRef} onToken={setToken} />
            </div>

            <button type="submit" className="btn btn--primary btn--big btn--block" disabled={status === 'submitting'}>
              {status === 'submitting'
                ? (<><span className="spinner spinner--sm" /> Sending…</>)
                : (<>Send enquiry <Icon name="send" size={15} /></>)}
            </button>
            <p className="field__hint text-center mt-16">
              By submitting you agree we may contact you about your enquiry.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

export default Contact;
