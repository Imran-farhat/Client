import { useMemo, useState } from 'react';

const images = [
  { src: 'https://images.unsplash.com/photo-1514709814142-421ad3eaef81?auto=format&fit=crop&w=1200&q=80', caption: 'Spark and metal craft', category: 'Events' },
  { src: 'https://images.unsplash.com/photo-1517457373958-b0f4e7b9d5b9?auto=format&fit=crop&w=1200&q=80', caption: 'Workshop fabrication floor', category: 'Workshops' },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', caption: 'Event showcase', category: 'Events' },
  { src: 'https://images.unsplash.com/photo-1516796182154-0f0163bfff91?auto=format&fit=crop&w=1200&q=80', caption: 'Precision joint weld', category: 'Workshops' },
];

const categories = ['All', 'Events', 'Workshops'];

function Gallery() {
  const [filter, setFilter] = useState('All');
  const [activeImage, setActiveImage] = useState(null);
  const filteredImages = useMemo(
    () => (filter === 'All' ? images : images.filter((item) => item.category === filter)),
    [filter]
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

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredImages.map((image) => (
            <button
              key={image.src}
              onClick={() => setActiveImage(image)}
              className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-card text-left shadow-sm transition hover:-translate-y-1"
            >
              <div className="relative h-72 overflow-hidden">
                <img src={image.src} alt={image.caption} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-sm uppercase tracking-[0.28em] text-amber">{image.category}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{image.caption}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-4xl rounded-3xl bg-primary p-4 shadow-2xl shadow-black/70">
            <button className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-2 text-sm text-primary hover:bg-card" onClick={() => setActiveImage(null)}>
              Close
            </button>
            <img src={activeImage.src} alt={activeImage.caption} className="h-[70vh] w-full rounded-3xl object-cover" />
            <div className="mt-4 rounded-3xl border border-[var(--border)] bg-card p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-amber">{activeImage.category}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{activeImage.caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Gallery;
