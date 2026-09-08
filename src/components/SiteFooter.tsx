import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "@/config/ads";

const links = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms" },
  { to: "/disclaimer", label: "Disclaimer" },
];

const SiteFooter = () => (
  <footer className="border-t border-border mt-10 py-6 text-center space-y-3">
    <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="text-xs text-muted-foreground hover:text-primary transition-colors">
          {l.label}
        </Link>
      ))}
    </nav>
    <p className="text-xs text-muted-foreground">
      © {new Date().getFullYear()} CineRadar • AI Movie Intelligence Engine
    </p>
    <p className="text-[11px] text-muted-foreground/80">
      Contact: <a className="hover:text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </p>
  </footer>
);

export default SiteFooter;
