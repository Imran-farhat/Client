import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import NotFound from './pages/NotFound';

const pageTitles = {
  '/': 'Home | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/about': 'About | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/services': 'Services | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/gallery': 'Gallery | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/register': 'Register | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/contact': 'Contact | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/login': 'Login | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/signup': 'Signup | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/profile': 'Profile | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/admin': 'Admin Dashboard | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
};

const MAINTENANCE_MODE = true; // Set to true to block access, false to resume live site

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = pageTitles[location.pathname] || 'தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்';
  }, [location]);

  if (MAINTENANCE_MODE) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#003366] text-white p-6 text-center font-sans">
        <div className="max-w-xl bg-[#002244] border border-[#FFB347]/30 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#FF6B00] flex items-center justify-center text-4xl shadow-lg shadow-[#FF6B00]/20 animate-pulse">
            🛠️
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#FFB347] leading-snug">
            உறுப்பினர் பதிவு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-white/90">
            Maintenance Mode / Under Upgrade
          </h2>

          <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(255, 179, 71, 0.4), transparent)', margin: '16px 0' }} />

          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்தின் இணையதளம் தற்போது புதுப்பிக்கப்பட்டு வருகிறது. விரைவில் புதிய வடிவமைப்புடன் நேரலைக்கு வரும். அதுவரை தங்களின் பொறுமைக்கு நன்றி!
          </p>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed italic">
            The membership portal is currently undergoing scheduled maintenance. Registration forms and account portals will be active shortly. Thank you for your patience!
          </p>

          <div className="pt-4 text-xs text-[#FFB347] font-semibold tracking-wider">
            தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-primary text-primary">
          <Navbar />
          <main className="relative overflow-hidden">
            <div className="route-transition">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute><AdminDashboard /></AdminRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
