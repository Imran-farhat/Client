import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import OrgLogo from '../components/OrgLogo';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, loginWithGoogleCredential, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = (e) => {
    e.preventDefault();
    loginWithEmail(email, password);
    if (email === 'admin@tiwtn.com' && password === 'admin123') {
      navigate('/admin');
    } else {
      navigate('/profile');
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
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={credentialResponse => {
                loginWithGoogleCredential(credentialResponse);
              }}
              onError={() => {
                console.log('Login Failed');
              }}
              useOneTap
            />
          </div>
          
          <button type="button" className="flex h-[40px] w-full items-center justify-center gap-2 rounded bg-[#1877F2] text-white text-sm font-medium transition hover:bg-[#166FE5]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook மூலம் உள்நுழை
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
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => alert('Reset link will be sent! (Supabase integration coming)')} className="mt-1 text-xs text-amber hover:underline">
              கடவுச்சொல் மறந்தீர்களா?
            </button>
          </div>

          <button type="submit" className="button-amber mt-2 w-full text-black py-3 rounded-xl font-bold">
            உள்நுழைக / Sign In
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
