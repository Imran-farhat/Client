import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Register from './pages/Register';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

const pageTitles = {
  '/': 'Home | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/about': 'About | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/services': 'Services | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/gallery': 'Gallery | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/register': 'Register | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
  '/contact': 'Contact | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்',
};

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = pageTitles[location.pathname] || 'தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்';
  }, [location]);

  return (
    <ThemeProvider>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}


export default App;
