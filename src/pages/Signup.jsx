import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupWithEmail, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      const redirectTo = window.location.hostname === 'localhost'
        ? 'http://localhost:5173/profile'
        : `${window.location.origin}/profile`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('கடவுச்சொற்கள் பொருந்தவில்லை / Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும்');
      return;
    }

    setLoading(true);
    try {
      await signupWithEmail(name, email, password);
      setSuccess('✅ கணக்கு உருவாக்கப்பட்டது! / Account created! Please Sign In.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[var(--bg-secondary)] px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <OrgLogo size={60} />
          <p className="mt-4 text-sm font-bold text-amber">தென்னிந்திய வெல்டிங்...</p>
          <hr className="my-4 w-full border-[var(--border)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">பதிவு செய் / Sign Up</h2>
        </div>

        <div className="mt-6 space-y-3">
          <button
            id="signup-google-btn"
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex h-[40px] w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white text-gray-700 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Google மூலம் பதிவு செய்
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <span className="text-xs text-[var(--text-muted)]">அல்லது / or</span>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#DC2626',
            fontSize: '13px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#16A34A',
            fontSize: '13px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">முழு பெயர் / Full Name</label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">மின்னஞ்சல் / Email</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">கடவுச்சொல் / Password</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">உறுதிப்படுத்து / Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Re-enter password"
            />
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            disabled={loading}
            className="button-amber mt-2 w-full text-black py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {loading ? 'பதிவு செய்கிறது...' : 'பதிவு செய் / Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          ஏற்கனவே கணக்கு உள்ளதா?{' '}
          <Link to="/login" className="font-semibold text-amber hover:underline">
            உள்நுழைக
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
