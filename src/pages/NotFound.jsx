import { Link } from 'react-router-dom';
import OrgLogo from '../components/OrgLogo';

function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-secondary px-6 py-16 text-primary md:px-10">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-[var(--border)] bg-primary p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 w-fit">
          <OrgLogo size={64} />
        </div>
        <p className="text-sm uppercase tracking-[0.3em] text-amber">Page Not Found</p>
        <h1 className="mt-6 text-4xl font-display text-navy sm:text-5xl">404 — The forge isn’t here.</h1>
        <p className="mt-4 text-secondary">The page you are looking for may have been moved, renamed, or does not exist.</p>
        <Link className="button-amber mt-10 inline-flex px-8 py-4 text-sm font-semibold text-black" to="/">Back to Home</Link>
      </div>
    </section>
  );
}

export default NotFound;
