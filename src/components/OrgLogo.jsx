import logoSrc from '../assets/logo.jpeg';

function OrgLogo({ size = 56 }) {
  return (
    <div
      className="inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-amber bg-[#003366]"
      style={{ width: size, height: size, minWidth: size }}
    >
      <img
        src={logoSrc}
        alt="TIWTN Logo"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default OrgLogo;
