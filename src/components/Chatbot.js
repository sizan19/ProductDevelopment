// Floating AI assistant widget ("Ava"). Present on every page via
// PublicLayout. Talks ONLY to our backend Gemini proxy (/api/chat) —
// the API key never reaches the browser. Surfaces a graceful
// "escalate to a human" prompt when the backend flags it.
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postJSON } from '../api';
import Icon from './Icon';

const GREETING = {
  role: 'assistant',
  text: "Hi, I'm Ava — the AI-Solutions virtual assistant. Ask me about our services, past projects or events, and I'll point you in the right direction.",
};

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sending]);

  // Focus the input when the panel opens.
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const data = await postJSON('/api/chat', { message: text, history });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, escalate: data.escalate }]);
      if (data.escalate) setEscalated(true);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          escalate: true,
          text: "I couldn't reach my AI service just now. Our team can help directly — please use the Contact Us page.",
        },
      ]);
      setEscalated(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className="chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant chat"
        >
          <Icon name="chat" size={24} />
        </button>
      )}

      {open && (
        <section className="chat-panel" role="dialog" aria-label="AI assistant" aria-modal="false">
          <header className="chat-head">
            <div className="chat-head__title">
              <span className="chat-head__dot" aria-hidden="true" />
              <span>
                <b>Ava</b><br />
                <small>AI VIRTUAL ASSISTANT</small>
              </span>
            </div>
            <button type="button" className="modal__close" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="close" size={16} />
            </button>
          </header>

          <div className="chat-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`msg msg--${m.role === 'user' ? 'user' : 'bot'}${m.escalate ? ' msg--escalate' : ''}`}
              >
                {m.text}
                {m.escalate && (
                  <div className="mt-8">
                    <Link to="/contact" className="btn btn--primary" onClick={() => setOpen(false)}>
                      Talk to a human <Icon name="arrow" size={13} />
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="msg msg--bot" aria-live="polite" aria-label="Ava is typing">
                <span className="chat-typing"><span /><span /><span /></span>
              </div>
            )}
          </div>

          <form className="chat-foot" onSubmit={send}>
            <label className="sr-only" htmlFor="chat-input">Message</label>
            <input
              id="chat-input"
              ref={inputRef}
              className="input"
              placeholder={escalated ? 'Ask another question…' : 'Type your message…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              autoComplete="off"
            />
            <button type="submit" className="btn btn--primary" disabled={sending || !input.trim()} aria-label="Send message">
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default Chatbot;
