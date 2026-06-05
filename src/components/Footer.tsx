const footerLinks = ['PRIVACY_POLICY', 'ENCRYPTION_DOCS', 'API_V1'];

export default function Footer() {
  return (
    <footer className="fixed bottom-0 w-full flex justify-between items-center px-10 py-4 z-40 bg-transparent border-t border-outline-variant/30 font-code-snippet text-code-snippet text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity">
      <div className="font-label-caps text-label-caps">
        © 2024 NEURAL_LINK_COMPLIANCE // ALL RIGHTS RESERVED
      </div>
      <div className="flex gap-8">
        {footerLinks.map((link) => (
          <a
            key={link}
            href="#"
            className="hover:text-tertiary-fixed-dim transition-colors"
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
