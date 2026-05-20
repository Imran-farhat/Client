import { NavLink } from 'react-router-dom';
import OrgLogo from './OrgLogo';

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Register', to: '/register' },
  { label: 'Contact', to: '/contact' },
];

function Footer() {
  return (
    <footer style={{ background: '#1A1A2E', borderTop: '1px solid rgba(255,255,255,0.1)' }} className="px-4 py-12 md:px-10">
      <div className="mx-auto max-w-7xl space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-10">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <OrgLogo size={56} />
            <div>
              <p className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</p>
              <p className="text-sm" style={{ color: '#CCCCCC' }}>Thennindia Welding Thozhilaalargal Nala Sangam, India</p>
            </div>
          </div>
          <p className="text-sm leading-6" style={{ color: '#CCCCCC' }}>Stay connected with our network of certified welding experts, training, and events across India.</p>
        </div>

        <div className="grid gap-8 text-center md:col-span-2 md:grid-cols-3 md:text-left">
          <div>
            <h3 className="mb-3 text-sm uppercase tracking-[0.3em]" style={{ color: '#ff5e00' }}>Quick Links</h3>
            <div className="space-y-2 text-sm" style={{ color: '#CCCCCC' }}>
              {links.map((link) => (
                <NavLink key={link.label} to={link.to} className="block transition hover:text-white" style={{ color: '#CCCCCC' }}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm uppercase tracking-[0.3em]" style={{ color: '#FF6B00' }}>Contact</h3>
            <p className="text-sm" style={{ color: '#CCCCCC' }}>info@wpa.org.in</p>
            <p className="text-sm" style={{ color: '#CCCCCC' }}>+91 98765 43210</p>
            <p className="text-sm" style={{ color: '#CCCCCC' }}>Industrial Estate, Pune, India</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm uppercase tracking-[0.3em]" style={{ color: '#FF6B00' }}>Follow Us</h3>
            <div className="flex flex-wrap justify-center gap-3 text-sm md:justify-start">
              <a href="#" className="transition" style={{ color: '#CCCCCC' }}>Facebook</a>
              <a href="#" className="transition" style={{ color: '#CCCCCC' }}>Instagram</a>
              <a href="#" className="transition" style={{ color: '#CCCCCC' }}>LinkedIn</a>
              <a href="#" className="transition" style={{ color: '#CCCCCC' }}>YouTube</a>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 text-center text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}>
        © 2025 தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம். All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
