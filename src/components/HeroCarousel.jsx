import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';

const FALLBACK_SLIDES = [
  {
    id: 'f1',
    title: 'தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச் சங்கம்',
    category: 'CAROUSEL',
    image_url: 'https://res.cloudinary.com/dejryogbg/image/upload/v1793513553/members/gallery_1793513548971_1g969t2m25q.jpg',
    description: 'தென்னிந்திய வெல்டிங் தொழிலாளர்களை ஒன்றிணைக்கும் மாநில அளவிலான வரலாற்று சிறப்புமிக்க சங்க நிகழ்வு.',
  },
  {
    id: 'f2',
    title: 'தஞ்சாவூர் மாவட்டம் புதிய பொறுப்பாளர்கள் நியமனம்',
    category: 'CAROUSEL',
    image_url: 'https://res.cloudinary.com/dejryogbg/image/upload/v1791616694/members/gallery_1791616690740_7c0h2b2j6k5.jpg',
    description: 'மாவட்ட தோறும் சங்கத்தின் கட்டமைப்பை வலுப்படுத்தி தொழிலாளர்களுக்கு வழிகாட்டும் புதிய நிர்வாகிகள்.',
  },
  {
    id: 'f3',
    title: 'கடலூர் மத்திய மாவட்டம் நிர்வாகிகள் ஒன்றிணைவு',
    category: 'CAROUSEL',
    image_url: 'https://res.cloudinary.com/dejryogbg/image/upload/v1790576511/members/gallery_1790576505708_x8v6n9795w.jpg',
    description: 'வெல்டிங் தொழிலாளர்களின் உரிமை மற்றும் நலன்களை முன்னிறுத்தி நடைபெற்ற கலந்தாய்வுக் கூட்டம்.',
  },
  {
    id: 'f4',
    title: 'சங்கத்தின் துவக்க விழா மற்றும் நலத்திட்ட உதவிகள்',
    category: 'CAROUSEL',
    image_url: 'https://txsjdohsgqjtrtaikhem.supabase.co/storage/v1/object/public/gallery-images/gallery_1780594227271_a815xtv0tr5.jpg',
    description: 'தென்னிந்திய மாநிலங்களை ஒருங்கிணைத்து தொழிலாளர்களுக்கு சமூக பாதுகாப்பு வழங்கும் மாபெரும் தொடக்கம்.',
  },
];

function HeroCarousel() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch carousel slides: First checks dedicated 'CAROUSEL' slides uploaded by Admin,
  // falls back to latest gallery items if none uploaded yet.
  const fetchCarouselSlides = useCallback(async () => {
    try {
      // 1. Check for admin-uploaded CAROUSEL slides
      const { data: carouselData, error: carouselErr } = await supabase
        .from('gallery')
        .select('id, title, category, image_url, description, created_at')
        .eq('category', 'CAROUSEL')
        .order('created_at', { ascending: false });

      if (!carouselErr && carouselData && carouselData.length > 0) {
        setSlides(carouselData);
        return;
      }

      // 2. Fallback to latest gallery events
      const { data: galleryData, error: galleryErr } = await supabase
        .from('gallery')
        .select('id, title, category, image_url, description, created_at')
        .order('created_at', { ascending: false })
        .limit(16);

      if (!galleryErr && galleryData && galleryData.length > 0) {
        const seen = new Set();
        const uniqueSlides = [];
        for (const item of galleryData) {
          const key = (item.title || '').trim().toLowerCase();
          if (!seen.has(key) && item.image_url) {
            seen.add(key);
            uniqueSlides.push(item);
          }
          if (uniqueSlides.length >= 6) break;
        }
        if (uniqueSlides.length > 0) {
          setSlides(uniqueSlides);
        }
      }
    } catch (err) {
      console.warn('Hero carousel slide fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCarouselSlides();

    // Real-time subscription so admin carousel uploads show up live immediately
    const channel = supabase
      .channel('home-hero-carousel-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
        fetchCarouselSlides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCarouselSlides]);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay timer with pause on hover
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, total, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setIsPaused(false);
  };

  return (
    <div
      className="group relative overflow-hidden rounded-[28px] md:rounded-[36px] border border-[var(--border)] bg-card shadow-xl flex flex-col justify-end w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[500px] select-none"
      style={{ boxShadow: 'var(--card-shadow)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Hero Carousel"
    >
      {/* Background Images with responsive autocrop (object-cover object-center) */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image_url}
                alt={slide.title || 'Slide'}
                className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>

      {/* Clean pagination indicators only (No text, pure image carousel) */}
      <div className="relative z-20 pb-5 px-6 flex justify-center items-center gap-2">
        {slides.map((_, dotIndex) => (
          <button
            key={dotIndex}
            onClick={() => setCurrentIndex(dotIndex)}
            className={`transition-all duration-300 rounded-full h-2 min-h-[8px] drop-shadow-md ${
              dotIndex === currentIndex
                ? 'w-8 bg-amber'
                : 'w-2 bg-white/60 hover:bg-white/90'
            }`}
            aria-label={`Go to slide ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;
