import OrgLogo from '../components/OrgLogo';
import balajiPhoto from '../assets/balaji.png';
import idhreesPhoto from '../assets/Idhrees.jpeg';
import muraliPhoto from '../assets/murali.jpeg';

function About() {
  const team = [
    { name: 'Balaji', role: 'Founder & Chair', photo: balajiPhoto, photoPosition: 'center center' },
    { name: 'Idhrees', role: 'Certification Director', photo: idhreesPhoto, photoPosition: 'center 25%' },
    { name: 'Murali', role: 'Training Lead', photo: muraliPhoto, photoPosition: 'center center' },
  ];

  const milestones = [
    { year: '2007', event: 'தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் Founded to elevate welding standards across India.' },
    { year: '2010', event: 'First certification program launched for industrial members.' },
    { year: '2016', event: 'Expanded training workshops into 11 branches nationwide.' },
    { year: '2023', event: 'National job placement initiative reaches 5,000 professionals.' },
  ];

  return (
    <section className="bg-secondary px-6 py-16 text-primary md:px-10">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-amber">WHO WE ARE</p>
          <h1 className="mt-4 text-3xl font-display text-navy sm:text-5xl">Forging history through expertise and grit.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் has spent nearly two decades building a premium welding community that blends hands-on craftsmanship, rigorous certification, and industrial networking. Our story is grounded in the fire of steel fabrication, the discipline of safety compliance, and the ambition to equip every welder with futureproof skills.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <h2 className="text-3xl font-display text-navy">Mission</h2>
            <p className="mt-4 text-secondary">To empower welders with premium certification, career mobility, and a collaborative platform that sets the standard for welding excellence across India.</p>
          </div>
          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <h2 className="text-3xl font-display text-navy">Vision</h2>
            <p className="mt-4 text-secondary">To become the foremost association for industrial welding professionals, known for quality training, trusted certification, and a thriving national community.</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="rounded-[32px] border border-[var(--border)] bg-primary p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row">
              <OrgLogo size={60} />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber">Leadership</p>
                <p className="mt-2 text-lg text-secondary">The team that leads our association, connects members, and grows welding standards across South India.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {team.map((member) => (
                <div key={member.name} className="rounded-3xl border border-[var(--border)] bg-secondary p-6 text-center">
                  <img src={member.photo} alt={member.name} className="mx-auto h-32 w-32 rounded-full object-cover" style={{ objectPosition: member.photoPosition }} />
                  <h3 className="mt-5 text-xl font-semibold text-navy">{member.name}</h3>
                  <p className="mt-2 text-sm text-secondary">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber">Timeline</p>
            <div className="mt-8 space-y-6">
              {milestones.map((item) => (
                <div key={item.year} className="grid gap-3 rounded-3xl border border-[var(--border)] bg-secondary p-6 sm:grid-cols-[120px_1fr] sm:items-center">
                  <p className="text-2xl font-display text-amber">{item.year}</p>
                  <p className="text-secondary">{item.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
