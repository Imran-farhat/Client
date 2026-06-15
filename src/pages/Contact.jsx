import { useState, useRef, useEffect } from 'react';
import SEO from '../components/SEO';
import PageLoader from '../components/PageLoader';

const info = [
  { title: 'Phone', value: '+91 98765 43210, +91 86085 08342, +91 97861 11700' },
  { title: 'Email', value: 'thenindiawelding@gmail.com' },
  { title: 'Address', value: 'மாநில தலைமை நிர்வாக அலுவலகம் 133/34 1A, 1A பெங்களூரு ஹைவே சென்னை -600124, தமிழ்நாடு.' },
  { title: 'Hours', value: 'Mon - Sat | 9am - 6pm' },
];

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: 'fecf7859-db02-4db0-9e17-08fedad22e49',
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
         }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Web3Forms error:', err);
      setStatus('error');
    }
  };

  if (loading) {
    return <PageLoader message="தொடர்பு பக்கத்தை ஏற்றுகிறது..." />;
  }

  return (
    <>
      <SEO
        title="தொடர்பு கொள்ள / Contact"
        description="தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்தை தொடர்பு கொள்ள - South India Welding Workers Welfare Association Contact Info"
        url="/contact"
      />
      <section className="bg-secondary px-6 py-16 text-primary md:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber">CONTACT</p>
            <h1 className="mt-4 text-3xl font-display text-navy md:text-5xl">We're ready to help you connect with தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">Reach out for membership support, certification questions, and event inquiries across our welding network.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-[var(--border)] bg-card p-8 shadow-sm">
              <h2 className="text-3xl font-display text-navy">Send a Message</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-primary">Name</span>
                  <input value={form.name} onChange={handleChange('name')} placeholder="Your name" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-primary">Email</span>
                  <input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-primary">Subject</span>
                  <input value={form.subject} onChange={handleChange('subject')} placeholder="Subject" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-primary">Message</span>
                  <textarea rows="5" value={form.message} onChange={handleChange('message')} placeholder="Your message" />
                </label>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="button-amber inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending...' : 'Submit Message'}
                </button>
                {status === 'success' && (
                  <p className="text-sm text-green-500 font-medium">
                    ✓ Message sent successfully — we'll get back to you soon!
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-sm text-red-500 font-medium">
                    ✗ Failed to send. Please try again or email us directly.
                  </p>
                )}
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-[var(--border)] bg-card p-8 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-amber">Contact Info</p>
                <div className="mt-6 space-y-4">
                  {info.map((item) => (
                    <div key={item.title} className="rounded-3xl border border-[var(--border)] bg-secondary p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-muted">{item.title}</p>
                      <p className="mt-2 text-lg text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-[var(--border)] bg-card p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-amber">Our Location</p>
                <div className="mt-4 h-56 overflow-hidden rounded-3xl border border-[var(--border)] bg-secondary">
                  <iframe className="h-full w-full" src="https://maps.google.com/maps?q=Pune%20India&t=&z=13&ie=UTF8&iwloc=&output=embed" title="Map" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
