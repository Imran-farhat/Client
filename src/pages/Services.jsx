import OrgLogo from '../components/OrgLogo';

const services = [
  { title: 'Membership Registration', description: 'Fast-track access to our welding association network, certifications, and events.', icon: '⚙️' },
  { title: 'Certification Programs', description: 'Structured certification for MIG, TIG, Arc, and specialist welding credentials.', icon: '✔️' },
  { title: 'Training Workshops', description: 'Hands-on workshops with industry mentors and live fabrication sessions.', icon: '🔥' },
  { title: 'Job Placement Assistance', description: 'Connect with employers seeking certified welding professionals across India.', icon: '🤝' },
  { title: 'Safety Compliance Guidance', description: 'Guidance on workplace safety, compliance audits, and welding best practices.', icon: '🛡️' },
  { title: 'Industrial Networking Events', description: 'Exclusive events that bring welding leaders, manufacturers, and contractors together.', icon: '🌐' },
];

function Services() {
  return (
    <section className="bg-secondary px-6 py-16 text-primary md:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-amber">WHAT WE OFFER</p>
          <h1 className="mt-4 text-3xl font-display text-navy md:text-5xl">Industry-leading services for welding professionals.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">From certification to career placement, our services are designed to strengthen welding careers and raise industrial standards nationwide.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="group rounded-[32px] border border-[var(--border)] bg-card p-8 shadow-sm transition hover:-translate-y-1 hover:border-amber">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border)] bg-secondary text-2xl text-amber shadow-sm transition group-hover:bg-amber/10">{service.icon}</div>
              <h3 className="text-2xl font-semibold text-primary">{service.title}</h3>
              <p className="mt-4 text-secondary">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
