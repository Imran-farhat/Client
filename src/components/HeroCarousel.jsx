import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';

function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch ONLY images explicitly uploaded as CAROUSEL by the Admin.
  // Never fallback to general gallery albums or random photos.
  const fetchCarouselSlides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('id, image_url, created_at')
        .eq('category', 'CAROUSEL')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSlides(data || []);
      setCurrentIndex(0);
    } catch (err) {
      console.warn('Hero carousel slide fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCarouselSlides();

    // Real-time subscription so admin carousel uploads & deletions reflect immediately
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
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
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
    if (total <= 1) return;
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (total <= 1) return;
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setIsPaused(false);
  };

  // If the admin has deleted all slides (or has not added any yet),
  // do NOT show any phantom or un-added images.
  if (total === 0) {
    return null;
  }

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
                alt="Hero Carousel Slide"
                className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>

      {/* Clean pagination indicators only if more than 1 image (No text, pure image) */}
      {total > 1 && (
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
      )}
    </div>
  );
}

export default HeroCarousel;
