import SEO from '../components/SEO';

const services = [
  {
    title: 'Membership Registration',
    description: 'Fast-track access to our welding association network, welfare support, and events.',
    icon: '⚙️',
  },
  {
    title: 'கட்டுமானத் தொழிலாளர்கள் நல வாரியம்',
    subtitle: 'Construction Workers Welfare Board',
    description: 'Organizing and bringing every worker together to ensure they receive and maximize all welfare benefits and government schemes (அனைத்து தொழிலாளர்களையும் ஒன்றிணைத்து நல வாரியத்தின் அனைத்து சலுகைகளையும் பெற்றுத் தருதல்).',
    icon: '🏛️',
  },
  {
    title: 'Safety Compliance Guidance',
    description: 'Guidance on workplace safety, compliance audits, and welding best practices.',
    icon: '🛡️',
  },
  {
    title: 'Industrial Networking Events',
    description: 'Exclusive events that bring welding leaders, manufacturers, and contractors together.',
    icon: '🌐',
  },
];

function Services() {
  return (
    <>
      <SEO
        title="சேவைகள் / Services"
        description="தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் வழங்கும் சேவைகள் - South India Welding Workers Welfare Association Services"
        url="/services"
      />
      <section className="bg-secondary px-6 py-16 text-primary md:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber">WHAT WE OFFER</p>
            <h1 className="mt-4 text-3xl font-display text-navy md:text-5xl">Industry-leading services for welding professionals.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">Our services are designed to organize welding workers, secure welfare board benefits, ensure workplace safety, and raise industrial standards nationwide.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.title} className="group rounded-[32px] border border-[var(--border)] bg-card p-8 shadow-sm transition hover:-translate-y-1 hover:border-amber flex flex-col justify-start">
                <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border)] bg-secondary text-2xl text-amber shadow-sm transition group-hover:bg-amber/10">{service.icon}</div>
                <h3 className="text-2xl font-semibold text-primary">{service.title}</h3>
                {service.subtitle && <p className="mt-1 text-sm font-medium text-amber">{service.subtitle}</p>}
                <p className="mt-4 text-secondary leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Services;
