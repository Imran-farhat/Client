import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithEmail, loginWithGoogleCredential, currentUser } = useAuth();
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
    
    loginWithEmail(email, password);
    navigate('/profile');
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
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={credentialResponse => {
                loginWithGoogleCredential(credentialResponse);
              }}
              onError={() => {
                console.log('Login Failed');
              }}
              text="signup_with"
              useOneTap
            />
          </div>
          
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <span className="text-xs text-[var(--text-muted)]">அல்லது / or</span>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
          </div>
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
