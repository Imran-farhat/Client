import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import SEO from '../components/SEO';
import PageLoader from '../components/PageLoader';

const categories = ['ALL', 'EVENTS', 'WORKSHOPS'];

let cachedGalleryItems = null;

function Gallery() {
  const [filter, setFilter] = useState('ALL');
  const [galleryItems, setGalleryItems] = useState(cachedGalleryItems || []);
  const [loading, setLoading] = useState(!cachedGalleryItems);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const items = data || [];
      cachedGalleryItems = items;
      setGalleryItems(items);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();

    const channel = supabase
      .channel('public-gallery-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        () => {
          fetchGallery();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredImages = useMemo(
    () => (filter === 'ALL' ? galleryItems : galleryItems.filter((item) => item.category === filter)),
    [filter, galleryItems]
  );

  const galleryAlbums = useMemo(() => {
    const groups = {};
    filteredImages.forEach(item => {
      const key = item.title.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          title: item.title,
          category: item.category,
          description: item.description,
          images: [],
          created_at: item.created_at
        };
      }
      groups[key].images.push(item);
      if (new Date(item.created_at) > new Date(groups[key].created_at)) {
        groups[key].created_at = item.created_at;
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filteredImages]);

  useEffect(() => {
    if (!activeAlbum) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === 0 ? activeAlbum.images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === activeAlbum.images.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        setActiveAlbum(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbum]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? activeAlbum.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === activeAlbum.images.length - 1 ? 0 : prev + 1));
  };

  if (loading) return <PageLoader message="புகைப்படங்களை ஏற்றுகிறது..." />;

  return (
    <>
      <SEO
        title="புகைப்பட தொகுப்பு / Gallery"
        description="தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்க புகைப்பட தொகுப்பு - South India Welding Workers Welfare Association Gallery"
        url="/gallery"
      />
      <section className="bg-secondary px-6 py-16 text-primary md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber">GALLERY</p>
            <h1 className="mt-4 text-3xl font-display text-navy md:text-5xl">Welding scenes from workshops and events.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">Explore our gallery of certification moments, and networking experiences.</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className={`rounded-full px-5 py-2 text-sm uppercase tracking-[0.26em] transition min-h-[44px] ${filter === category ? 'bg-amber text-black' : 'border border-[var(--border)] bg-card text-secondary hover:text-primary'}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {galleryAlbums.length === 0 ? (
          <div className="mt-12 text-center rounded-[28px] border border-[var(--border)] bg-card p-12 shadow-sm">
            <p className="text-lg text-[var(--text-muted)]">புகைப்படங்கள் ஏதும் இல்லை / No gallery images found</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {galleryAlbums.map((album) => (
              <button
                key={album.title}
                onClick={() => {
                  setActiveAlbum(album);
                  setActiveImageIndex(0);
                }}
                className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={album.images[0].image_url} alt={album.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Glassmorphism count pill */}
                  {album.images.length > 1 && (
                    <div className="absolute top-4 right-4 backdrop-blur-md bg-white/20 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1">
                      📁 {album.images.length} Images
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <p className="text-sm uppercase tracking-[0.28em] text-amber">{album.category}</p>
                    <p className="mt-2 text-lg font-semibold text-white leading-tight">{album.title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeAlbum && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4 md:p-6" onClick={() => setActiveAlbum(null)}>
          <div className="flex min-h-full items-center justify-center">
            <div 
              className="relative w-full max-w-4xl rounded-3xl bg-primary p-4 md:p-6 shadow-2xl my-4 flex flex-col justify-between"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute right-4 top-4 z-10 rounded-full bg-black/60 hover:bg-black/80 text-white w-9 h-9 flex items-center justify-center text-sm font-bold shadow-lg transition"
                onClick={() => setActiveAlbum(null)}
                aria-label="Close"
              >
                ✕
              </button>

              {/* Main Image Viewport with Navigation Arrows */}
              <div className="relative overflow-hidden rounded-2xl bg-black/5 flex items-center justify-between min-h-[300px] md:min-h-[450px]">
                {/* Left navigation arrow */}
                {activeAlbum.images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 z-10 rounded-full bg-black/60 hover:bg-amber hover:text-black text-white w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg transition-all"
                    title="Previous Image"
                  >
                    ‹
                  </button>
                )}

                <img
                  src={activeAlbum.images[activeImageIndex].image_url}
                  alt={activeAlbum.title}
                  className="max-h-[50vh] md:max-h-[60vh] w-full object-contain mx-auto"
                />

                {/* Right navigation arrow */}
                {activeAlbum.images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 z-10 rounded-full bg-black/60 hover:bg-amber hover:text-black text-white w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg transition-all"
                    title="Next Image"
                  >
                    ›
                  </button>
                )}

                {/* Image counter in top left */}
                {activeAlbum.images.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {activeImageIndex + 1} / {activeAlbum.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {activeAlbum.images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 justify-center scrollbar-thin">
                  {activeAlbum.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeImageIndex === idx ? 'border-amber scale-105 shadow-md shadow-amber/20' : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Description Panel */}
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-card p-4 md:p-6 text-left">
                <p className="text-xs md:text-sm uppercase tracking-[0.28em] text-amber font-semibold">{activeAlbum.category}</p>
                <p className="mt-1 text-lg md:text-2xl font-bold text-primary leading-snug">{activeAlbum.title}</p>
                {activeAlbum.description && (
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{activeAlbum.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

export default Gallery;
