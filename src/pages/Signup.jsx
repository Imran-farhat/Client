import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithEmail, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleSignup = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Mock login after signup
    loginWithEmail(email, password);
    navigate('/profile');
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
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

        <div className="mt-6">
          <button onClick={handleGoogleLogin} type="button" className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg border border-[#DDDDDD] bg-white text-[#333] transition hover:bg-[#F5F5F5]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google மூலம் தொடரவும்
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]"></div>
          <span className="text-xs text-[var(--text-muted)]">அல்லது / or</span>
          <div className="h-px flex-1 bg-[var(--border)]"></div>
        </div>

        {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">முழு பெயர் / Full Name</label>
            <input
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
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" className="button-amber mt-2 w-full text-black py-3 rounded-xl font-bold">
            பதிவு செய் / Sign Up
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
