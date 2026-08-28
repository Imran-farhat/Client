import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      const target = location.state?.redirectTo || (isAdmin ? '/admin' : '/profile');
      navigate(target, { replace: true });
    }
  }, [currentUser, isAdmin, navigate, location.state]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const target = location.state?.redirectTo || '/profile';
      const redirectTo = window.location.hostname === 'localhost'
        ? `http://localhost:5173${target}`
        : `${window.location.origin}${target}`;

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
      console.error('Google login error:', err);
      setError(err.message || 'உள்நுழைவதில் பிழை / Login failed');
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
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            இணையதளத்திற்குள் நுழைய உங்கள் கூகுள் கணக்கைப் பயன்படுத்தவும்.
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Please use your Google Account to sign in.
          </p>
        </div>

        {location.state?.message && (
          <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 p-3 text-center text-sm text-amber font-semibold">
            ⚠️ {location.state.message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-center text-xs text-red-600">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6">
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {loading ? 'இணைக்கிறது... / Connecting...' : 'Google மூலம் உள்நுழை / Sign In with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
