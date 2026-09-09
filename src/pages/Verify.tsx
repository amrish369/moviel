import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Share2,
  Copy,
  Clapperboard,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdSlot from "@/components/AdSlot";
import AdsterraBanner from "@/components/AdsterraBanner";
import AdsterraIframe from "@/components/AdsterraIframe";
import SiteFooter from "@/components/SiteFooter";
import { ADSTERRA, AD_SLOTS, SITE_URL } from "@/config/ads";
import { usePageMeta } from "@/lib/seo";

const WAIT_SECONDS = 15;

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/music", label: "Music" },
  { to: "/study", label: "Study Hub" },
  { to: "/about", label: "About" },
];

const FAQS = [
  {
    q: "Why do I have to verify?",
    a: "The bot and this site are free. A quick sponsor visit covers the hosting and file costs instead of charging you.",
  },
  {
    q: "How long does verification last?",
    a: "Each link stays valid for 2 hours. After that just request the file again in the bot to get a fresh link.",
  },
  {
    q: "My link says expired — what now?",
    a: "Go back to @Cinedbot, send the movie name again and tap Verify & Unlock on the new message.",
  },
];

const Verify = () => {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [opened, setOpened] = useState(false);
  const [left, setLeft] = useState(WAIT_SECONDS);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  usePageMeta({
    title: "Verify & Unlock Your Movie File | CineRadar",
    description:
      "Complete 3 quick steps — open the sponsor page, wait a few seconds, confirm — then return to the CineRadar Telegram bot and tap Send File to get your movie.",
    url: `${SITE_URL}/verify`,
  });

  useEffect(() => {
    if (!opened || left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [opened, left]);

  const openOffer = () => {
    setOpened(true);
    window.open(ADSTERRA.directLink, "_blank", "noopener");
  };

  const shareLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "CineRadar — unlock your movie", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed share sheet */
    }
  };

  const confirm = async () => {
    if (!token) { setError("This link is missing its code. Start again from the bot."); return; }
    setBusy(true); setError(null);
    const { data, error: fnErr } = await supabase.functions.invoke("unlock", {
      body: { action: "verify", token },
    });
    setBusy(false);
    if (fnErr || (data as any)?.error) {
      setError((data as any)?.error || "Verification failed. Please try again.");
      return;
    }
    setDone(true);
  };

  const Step = ({ n, title, children, active }: { n: number; title: string; children?: React.ReactNode; active: boolean }) => (
    <div className={`glass-card rounded-xl p-4 border ${active ? "border-primary/50" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
        <h2 className="font-display text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-xl mx-auto space-y-4">
      <header className="text-center space-y-1">
        <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
        <h1 className="font-display text-xl font-bold text-gradient-gold">Verify to unlock your file</h1>
        <p className="text-xs text-muted-foreground">
          Complete these 3 quick steps, then go back to the Telegram bot and tap <b>Send File</b>.
        </p>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Browse CineRadar while you wait <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <AdSlot slot={AD_SLOTS.headerBanner} minHeight={120} />

      <Step n={1} title="Open the sponsor page" active={!opened}>
        <button onClick={openOffer} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5">
          Open sponsor <ExternalLink className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-muted-foreground mt-2">Opens in a new tab. Come back here after it loads.</p>
        <button
          onClick={shareLink}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary py-2"
        >
          {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Link copied</> : <><Share2 className="w-3.5 h-3.5" /> Share this page</>}
        </button>
      </Step>

      <AdsterraIframe />

      <Step n={2} title="Wait a few seconds" active={opened && left > 0}>
        {!opened ? (
          <p className="text-xs text-muted-foreground">Finish step 1 first.</p>
        ) : left > 0 ? (
          <p className="text-sm text-primary font-bold">{left}s remaining…</p>
        ) : (
          <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Done</p>
        )}
      </Step>

      <section className="glass-card rounded-xl p-4 space-y-2">
        <h2 className="font-display text-sm font-bold text-foreground">Why this step?</h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Keeps the bot and this site completely free.</li>
          <li>No payment, no signup, no app install.</li>
          <li>Takes about 20 seconds — one time per file.</li>
        </ul>
      </section>

      <AdsterraBanner />

      <Step n={3} title="Confirm and get your file" active={opened && left === 0 && !done}>
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Verified! Go back to the bot and tap <b>Send File</b>.
            </p>
            <a href="https://t.me/Cinedbot" target="_blank" rel="noopener noreferrer"
              className="block text-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5">
              Back to Telegram bot
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={confirm}
              disabled={!opened || left > 0 || busy}
              className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              I have completed the steps
            </button>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </>
        )}
      </Step>

      <section className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm font-bold text-foreground">What is CineRadar?</h2>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Daily Bollywood, Tamil, Telugu, Malayalam and OTT releases.</li>
          <li>Instagram-style trailer reels and full movie pages with cast and plot.</li>
          <li>Reviews, box office numbers and AI picks made for you.</li>
          <li>A music player with background play and a free study hub.</li>
        </ul>
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5"
        >
          Explore CineRadar <ArrowRight className="w-4 h-4" />
        </Link>
        <nav className="flex flex-wrap justify-center gap-2 pt-1">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="font-display text-sm font-bold text-foreground">Frequently asked</h2>
        {FAQS.map((f) => (
          <div key={f.q}>
            <h3 className="text-xs font-semibold text-foreground">{f.q}</h3>
            <p className="text-xs text-muted-foreground">{f.a}</p>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground/80 border-t border-border pt-3">
          CineRadar hosts no video files. Movie information comes from TMDB and videos are embedded from public sources.
        </p>
      </section>

      <AdSlot slot={AD_SLOTS.footerBanner} minHeight={250} />
      <SiteFooter />
    </div>
  );
};

export default Verify;
