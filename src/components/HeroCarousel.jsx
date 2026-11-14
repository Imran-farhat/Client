import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';

function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch ONLY images explicitly uploaded as CAROUSEL by the Admin.
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

  // If no carousel slides exist, render nothing (no phantom or un-added images)
  if (total === 0) {
    return null;
  }

  return (
    <div
      className="group relative overflow-hidden rounded-[24px] sm:rounded-[28px] md:rounded-[36px] border border-[var(--border)] bg-card shadow-xl w-full select-none"
      style={{ boxShadow: 'var(--card-shadow)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Hero Carousel"
    >
      {/* 
        Dynamic Stack Grid:
        All slides share the exact same grid area ('slide') so the container height 
        adapts dynamically to the natural height of the image without fixed restrictions.
      */}
      <div
        className="grid w-full"
        style={{ gridTemplateAreas: "'slide'" }}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              style={{ gridArea: 'slide' }}
              className={`w-full flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image_url}
                alt={`Hero Carousel Slide ${index + 1}`}
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                className="w-full h-auto object-contain block mx-auto md:max-h-[540px]"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>

      {/* Desktop Navigation Controls (visible on hover) */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center text-xl backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center text-xl backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
          >
            ›
          </button>
        </>
      )}

      {/* Clean pagination indicators (only when multiple slides exist) */}
      {total > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-2 pointer-events-auto">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => setCurrentIndex(dotIndex)}
              className={`transition-all duration-300 rounded-full h-2 min-h-[8px] drop-shadow-md ${
                dotIndex === currentIndex
                  ? 'w-7 sm:w-8 bg-amber'
                  : 'w-2 bg-white/70 hover:bg-white'
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
