import { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import OrgLogo from './OrgLogo';
import { ThemeContext } from '../context/ThemeContext';

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className={`sticky top-0 z-50 w-full transition duration-300 ${scrolled ? 'backdrop-blur-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.10)]' : ''} bg-nav-bg`}
      style={{ borderBottom: '2px solid var(--nav-border)' }}>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-3 px-4 py-3 md:h-[70px] md:flex-nowrap md:items-center md:px-10">
        <NavLink to="/" className="flex min-w-0 items-center gap-3">
          <OrgLogo size={52} />
          <div className="flex min-w-0 flex-col text-left">
            <p className="text-[12px] font-bold leading-tight text-amber sm:text-[14px]">தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</p>
            <p className="mt-0.5 text-[10px] leading-snug text-secondary sm:text-[11px]">Thennindia Welding Thozhilaalargal Nala Sangam</p>
          </div>
        </NavLink>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition min-h-[44px] flex items-center ${active ? 'font-bold text-amber' : 'text-[#1A1A2E] dark:text-[#CCCCCC] hover:text-amber'}`}
                  style={active ? { fontWeight: 700, color: 'var(--amber)' } : {}}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="group relative">
            <button type="button" onClick={toggleTheme}
              className="relative flex items-center rounded-full transition-all duration-300"
              style={{
                width: '72px',
                height: '34px',
                borderRadius: '17px',
                backgroundColor: theme === 'dark' ? '#2A2A2A' : '#E5DDD0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              aria-label="Toggle theme">
              <span className="absolute left-2 text-sm" style={{ opacity: theme === 'dark' ? 0.4 : 1 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="absolute right-2 text-sm" style={{ opacity: theme === 'dark' ? 1 : 0.4 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span className="flex items-center justify-center rounded-full bg-amber text-xs text-white shadow-sm transition-all duration-300"
                style={{
                  width: '26px',
                  height: '26px',
                  transform: theme === 'dark' ? 'translateX(0)' : 'translateX(38px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1A1A2E] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#F0F0F0] dark:text-[#1A1A2E] pointer-events-none">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          <NavLink to="/register" className="button-amber inline-flex px-4 py-2 text-sm font-semibold text-black">
            Register
          </NavLink>
        </div>

        <button type="button" className="inline-flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-2 text-secondary md:hidden" onClick={() => setOpen((prev) => !prev)} aria-label="Toggle menu">
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${open ? 'translate-y-[4.5px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${open ? '-translate-y-[4.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      <div className={`md:hidden overflow-hidden border-t border-[var(--border)] bg-[var(--nav-bg)] transition-all duration-300 ${open ? 'max-h-[500px] py-4' : 'max-h-0 py-0'}`}>
        <div className="space-y-2 px-6">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <NavLink
                key={link.label}
                to={link.to}
                className={`flex h-12 items-center rounded-xl px-4 text-sm font-medium transition ${active ? 'bg-amber text-black' : 'text-secondary hover:bg-[var(--bg-secondary)]'}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            );
          })}
          <button type="button" onClick={toggleTheme} className="flex h-12 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-secondary transition hover:bg-[var(--bg-secondary)]">
            <span className="mr-2">{theme === 'dark' ? '🌙' : '☀️'}</span>
            Toggle Theme
          </button>
          <NavLink to="/register" className="flex h-12 w-full items-center justify-center rounded-xl bg-amber font-semibold text-black transition hover:bg-amber-light" onClick={() => setOpen(false)}>
            Register
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
