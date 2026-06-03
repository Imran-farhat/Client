import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithEmail, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(isAdmin ? '/admin' : '/profile');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      // Google OAuth redirects — no navigate needed here
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate(isAdmin ? '/admin' : '/profile');
    } catch (err) {
      setError(err.message);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">உள்நுழைக / Sign In</h2>
        </div>

        <div className="mt-6 space-y-3">
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
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
            Google மூலம் உள்நுழை
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]"></div>
          <span className="text-xs text-[var(--text-muted)]">அல்லது / or</span>
          <div className="h-px flex-1 bg-[var(--border)]"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => alert('Reset link will be sent! (Coming soon)')}
              className="mt-1 text-xs text-amber hover:underline"
            >
              கடவுச்சொல் மறந்தீர்களா?
            </button>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#DC2626',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="button-amber mt-2 w-full text-black py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {loading ? 'உள்நுழைகிறது...' : 'உள்நுழைக / Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          கணக்கு இல்லையா?{' '}
          <Link to="/signup" className="font-semibold text-amber hover:underline">
            பதிவு செய்
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
