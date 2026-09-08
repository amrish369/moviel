import { useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import { CONTACT_EMAIL, AD_SLOTS } from "@/config/ads";

const useMeta = (title: string, description: string) => {
  useEffect(() => {
    document.title = title;
    let d = document.querySelector('meta[name="description"]');
    if (!d) {
      d = document.createElement("meta");
      d.setAttribute("name", "description");
      document.head.appendChild(d);
    }
    d.setAttribute("content", description);
  }, [title, description]);
};

const Shell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <Link to="/" aria-label="Back to home" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-display text-lg font-bold text-gradient-gold">{title}</h1>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-8">
      <article className="glass-card rounded-xl p-5 space-y-4 text-sm text-muted-foreground leading-relaxed [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary">
        {children}
      </article>
      <AdSlot slot={AD_SLOTS.article} className="my-8" minHeight={250} />
      <SiteFooter />
    </main>
  </div>
);

const updated = "September 2026";

export const Privacy = () => {
  useMeta("Privacy Policy | CineRadar", "How CineRadar collects, uses and protects your data, including cookies and third-party advertising by Google AdSense.");
  return (
    <Shell title="Privacy Policy">
      <p>Last updated: {updated}</p>
      <p>CineRadar ("we", "us") operates this website. This page explains what information we collect and how it is used.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account data (email address) if you choose to sign in.</li>
        <li>Preferences such as watchlist, liked titles and study progress, stored in your browser or in your account.</li>
        <li>Anonymous usage data — pages viewed, device type, approximate region.</li>
      </ul>
      <h2>Cookies and advertising</h2>
      <p>We use cookies to keep you signed in and to remember preferences. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.</p>
      <ul>
        <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</li>
        <li>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
        <li>You may opt out of third-party vendor cookies at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info/choices</a>.</li>
        <li>Other advertising partners (for example Adsterra) and affiliate programmes may also set cookies when their ads are displayed.</li>
      </ul>
      <h2>Third-party services</h2>
      <p>We use TMDB for movie metadata, YouTube for trailers and music playback, and a secure cloud backend for accounts. Each has its own privacy policy.</p>
      <h2>Children's privacy</h2>
      <p>This site is not directed at children under 13 and we do not knowingly collect their data.</p>
      <h2>Your rights</h2>
      <p>You can request access to or deletion of your data at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Shell>
  );
};

export const Terms = () => {
  useMeta("Terms of Service | CineRadar", "Terms and conditions for using CineRadar's movie discovery, music and study features.");
  return (
    <Shell title="Terms of Service">
      <p>Last updated: {updated}</p>
      <h2>Acceptance</h2>
      <p>By using CineRadar you agree to these terms. If you do not agree, please stop using the site.</p>
      <h2>Use of the service</h2>
      <ul>
        <li>CineRadar provides movie information, trailers, publicly available music and study material discovery.</li>
        <li>You agree not to misuse the service, attempt to break its security, or scrape it automatically.</li>
        <li>Accounts must not be shared or used to impersonate others.</li>
      </ul>
      <h2>Content ownership</h2>
      <p>Movie posters, metadata, trailers and videos belong to their respective owners. CineRadar does not host any video or audio files; media is embedded from public sources such as YouTube.</p>
      <h2>Advertising</h2>
      <p>The site is supported by advertising and affiliate links. We may earn a commission when you use those links, at no extra cost to you.</p>
      <h2>Limitation of liability</h2>
      <p>The service is provided "as is" without warranty. We are not liable for inaccuracies in third-party data or for any loss arising from use of the site.</p>
      <h2>Changes</h2>
      <p>We may update these terms; continued use means acceptance of the updated terms.</p>
    </Shell>
  );
};

export const About = () => {
  useMeta("About CineRadar — AI Movie Intelligence", "CineRadar is an AI-powered dashboard for Bollywood, South Indian and OTT movies, music and study content.");
  return (
    <Shell title="About CineRadar">
      <h2>What we do</h2>
      <p>CineRadar is an independent, AI-assisted entertainment dashboard focused on Indian cinema. We bring together daily releases, OTT arrivals, trailers, reviews, box office numbers and personalised recommendations in one fast, mobile-friendly place.</p>
      <h2>What you'll find here</h2>
      <ul>
        <li>A personalised infinite feed of Bollywood, Tamil, Telugu, Malayalam and Kannada titles.</li>
        <li>Instagram-style trailer reels and full movie detail pages with cast and plot.</li>
        <li>A music section with background playback and artist pages.</li>
        <li>A study hub with subject-wise lecture playlists, progress tracking and quizzes.</li>
      </ul>
      <h2>Our data</h2>
      <p>Movie information comes from TMDB, videos are embedded from YouTube, and editorial summaries are generated with AI and reviewed for accuracy.</p>
      <h2>Contact</h2>
      <p>Questions, corrections or partnership requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </Shell>
  );
};

export const Contact = () => {
  useMeta("Contact CineRadar", "Get in touch with the CineRadar team for support, corrections, takedown requests or advertising enquiries.");
  return (
    <Shell title="Contact Us">
      <p>We usually reply within 2–3 working days.</p>
      <h2>Email</h2>
      <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      <h2>What to write about</h2>
      <ul>
        <li>Incorrect movie information or broken links</li>
        <li>Copyright or takedown requests</li>
        <li>Advertising and sponsorship enquiries</li>
        <li>Feature suggestions and bug reports</li>
      </ul>
      <h2>Telegram</h2>
      <p><a href="https://t.me/Cinedbot" target="_blank" rel="noopener noreferrer">@Cinedbot</a></p>
    </Shell>
  );
};

export const Disclaimer = () => {
  useMeta("Disclaimer | CineRadar", "CineRadar hosts no media files. Information is provided for general reference only.");
  return (
    <Shell title="Disclaimer">
      <p>Last updated: {updated}</p>
      <h2>General information</h2>
      <p>All information on CineRadar is published in good faith and for general information only. We make no warranty about its completeness, reliability or accuracy.</p>
      <h2>No hosting of media</h2>
      <p>CineRadar does not host, upload or store any movie, music or video file on its servers. All videos are embedded from publicly available third-party platforms such as YouTube. All rights belong to their respective owners.</p>
      <h2>External links</h2>
      <p>Our site contains links to external sites and advertisements. We are not responsible for their content or policies.</p>
      <h2>Copyright</h2>
      <p>If you believe content on this site infringes your copyright, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with details and we will act promptly.</p>
    </Shell>
  );
};
