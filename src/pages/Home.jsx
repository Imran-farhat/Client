import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import OrgLogo from '../components/OrgLogo';
import { supabase } from '../supabase/client';
import SEO from '../components/SEO';
import PageLoader from '../components/PageLoader';

const STATIC_STATS = [
  { label: 'செயல்பாட்டு ஆண்டுகள்', suffix: '+', staticNum: 6 },
  { label: 'கிளைகள்', suffix: '', staticNum: 38 },
];

const testimonials = [
  { quote: 'தென் இந்தியா வெல்டிங் தொழிலாளர்கள்கள் நலச்சங்கத்தைச் சேர்ந்ததன் மூலம் நான் இரண்டு ஆண்டுகளில் பயிற்சி பயில்வாளராஜிருந்து தலைசிறந்த வடிவாளர் ஆகி விட்டேன்.', name: 'Ananya Singh', role: 'Senior Welder' },
  { quote: 'The networking events brought me into high-value industrial partnerships.', name: 'Rohit Kumar', role: 'Fabrication Specialist' },
  { quote: 'Their certification boosted my career and credibility instantly.', name: 'Meera Patel', role: 'Inspection Lead' },
];

let cachedMemberCount = null;

function Home() {
  const [memberCount, setMemberCount] = useState(cachedMemberCount ?? null);
  const [count, setCount] = useState([0, 0, 0]); // [members, years, branches]

  // Fetch live member count from Supabase
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: rawCount, error } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        const total = rawCount ?? 0;
        // Only cache when we have actual members (avoid caching 0 from cold start)
        if (total > 0) {
          cachedMemberCount = total;
        }
        setMemberCount(total);
      } catch (err) {
        console.error('Error fetching member count:', err);
        if (cachedMemberCount === null) setMemberCount(0);
      }
    };
    fetchCount();

    // Real-time subscription so count updates as new members register
    const sub = supabase
      .channel('home-member-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchCount)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Animate static counters immediately on mount
  useEffect(() => {
    const staticTargets = [
      STATIC_STATS[0].staticNum,
      STATIC_STATS[1].staticNum,
    ];
    const duration = 2000;
    const steps = 60;

    staticTargets.forEach((target, index) => {
      const countIndex = index + 1; // 1 for years, 2 for branches
      let current = 0;
      const increment = target / steps;
      const interval = duration / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCount((prev) => {
          const next = [...prev];
          next[countIndex] = Math.floor(current);
          return next;
        });
      }, interval);
    });
  }, []);

  // Animate live member count once it is fetched
  useEffect(() => {
    if (memberCount === null) return;

    const target = memberCount;
    let current = 0;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCount((prev) => {
        const next = [...prev];
        next[0] = Math.floor(current);
        return next;
      });
    }, interval);
  }, [memberCount]);

  const displayStats = [
    { num: memberCount === null ? '...' : count[0], label: 'மொத்த உறுப்பினர்கள்', suffix: '', live: true },
    { num: count[1], label: 'செயல்பாட்டு ஆண்டுகள்', suffix: '+' },
    { num: count[2], label: 'கிளைகள்', suffix: '' },
  ];

  return (
    <>
      <SEO
        title="முகப்பு / Home"
        description="தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் - South India Welding Workers Welfare Association"
        url="/"
      />
      <section className="relative overflow-hidden bg-hero px-6 py-16 md:px-10">
      <ParticleBackground />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="logo-ring mx-auto w-fit">
            <OrgLogo size={100} />
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-amber font-semibold">Thennindia Welding Thozhilaalargal Nala Sangam</p>
          <h1 className="mt-4 text-[2rem] font-display tracking-[0.04em] md:text-5xl" style={{ color: '#FFFFFF' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 md:mt-6" style={{ color: '#B8C9E0' }}>Industrial-Premium Welding Network</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/register" className="button-amber inline-flex justify-center px-8 py-4 text-sm font-semibold text-black">
              Join Now
            </Link>
            <Link to="/about" className="inline-flex justify-center rounded-full border-2 px-8 py-4 text-sm font-medium transition hover:bg-white/10" style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}>
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="rounded-[32px] border border-[var(--border)] bg-card p-8" style={{ boxShadow: 'var(--card-shadow)' }}>
            <p className="text-sm uppercase tracking-[0.3em] text-amber/90">Member Highlights</p>
            <div className="mt-8 space-y-5">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-3xl border border-[var(--border)] bg-primary p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
                  <p className="text-lg leading-7 text-primary">"{item.quote}"</p>
                  <p className="mt-4 text-sm text-secondary">{item.name} · {item.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-card p-8" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {displayStats.map((stat, index) => (
                <div key={stat.label} className="rounded-3xl p-6 text-center" style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderLeft: '3px solid var(--amber)',
                  boxShadow: 'var(--card-shadow)',
                }}>
                  <p className="font-display" style={{ fontSize: '2.8rem', color: 'var(--navy)' }}>
                    {stat.num}
                    <span style={{ color: 'var(--amber)' }}>{stat.suffix}</span>
                  </p>
                  <p className="mt-2" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stat.label}</p>
                  {stat.live && (
                    <p style={{ fontSize: '10px', color: '#22C55E', marginTop: '2px', fontWeight: 600 }}>🟢 Live</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
  );
}

export default Home;
