import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const categories = ['ALL', 'EVENTS', 'WORKSHOPS', 'TRAINING'];

function Gallery() {
  const [filter, setFilter] = useState('ALL');
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGalleryItems(data || []);
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

  return (
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

        {loading ? (
          <div className="mt-12 flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber border-t-transparent"></div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="mt-12 text-center rounded-[28px] border border-[var(--border)] bg-card p-12 shadow-sm">
            <p className="text-lg text-[var(--text-muted)]">புகைப்படங்கள் ஏதும் இல்லை / No gallery images found</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredImages.map((image) => (
              <button
                key={image.id}
                onClick={() => setActiveImage(image)}
                className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-card text-left shadow-sm transition hover:-translate-y-1"
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={image.image_url} alt={image.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <p className="text-sm uppercase tracking-[0.28em] text-amber">{image.category}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{image.title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4 md:p-6">
          <div className="flex min-h-full items-center justify-center">
            <div className="relative w-full max-w-3xl rounded-3xl bg-primary p-3 md:p-4 shadow-2xl my-4">
              <button
                className="absolute right-4 top-4 z-10 rounded-full bg-black/60 hover:bg-black/80 text-white w-9 h-9 flex items-center justify-center text-sm font-bold shadow-lg transition"
                onClick={() => setActiveImage(null)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="overflow-hidden rounded-2xl bg-black/5">
                <img
                  src={activeImage.image_url}
                  alt={activeImage.title}
                  className="max-h-[45vh] md:max-h-[60vh] w-full object-contain mx-auto"
                />
              </div>
              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-card p-4 md:p-6">
                <p className="text-xs md:text-sm uppercase tracking-[0.28em] text-amber font-semibold">{activeImage.category}</p>
                <p className="mt-1 text-lg md:text-2xl font-bold text-primary leading-snug">{activeImage.title}</p>
                {activeImage.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{activeImage.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Gallery;
