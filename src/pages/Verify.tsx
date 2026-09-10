import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Share2,
  Clapperboard,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdSlot from "@/components/AdSlot";
import AdsterraBanner from "@/components/AdsterraBanner";
import AdsterraIframe from "@/components/AdsterraIframe";
import SiteFooter from "@/components/SiteFooter";
import { ADSTERRA, AD_SLOTS, SITE_URL } from "@/config/ads";
import { usePageMeta } from "@/lib/seo";

const HOLD_SECONDS = 10;
const BOT_URL = "https://t.me/Cinedbot";

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

/** Countdown that restarts whenever `resetKey` changes. */
const useHold = (seconds: number, resetKey: unknown) => {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = window.setInterval(
      () => setLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [seconds, resetKey]);
  return left;
};

/** True once the visitor has scrolled to (near) the bottom of the page. */
const useScrolledToEnd = (resetKey: unknown) => {
  const [reached, setReached] = useState(false);
  useEffect(() => {
    setReached(false);
    const check = () => {
      const atEnd =
        window.scrollY + window.innerHeight >=
        document.body.scrollHeight - 40;
      if (atEnd) setReached(true);
    };
    window.addEventListener("scroll", check, { passive: true });
    const t = window.setTimeout(check, 400);
    return () => {
      window.removeEventListener("scroll", check);
      window.clearTimeout(t);
    };
  }, [resetKey]);
  return reached;
};

const Progress = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center gap-2">
    {[1, 2, 3].map((n) => (
      <span
        key={n}
        className={`h-1.5 rounded-full transition-all ${
          n <= step ? "bg-primary w-10" : "bg-border w-6"
        }`}
      />
    ))}
  </div>
);

const Guide = ({ lines }: { lines: string[] }) => (
  <div className="glass-card rounded-xl p-4 border border-primary/40">
    <p className="text-[11px] uppercase tracking-widest text-primary mb-2">
      How to complete this step
    </p>
    <ol className="space-y-2 text-sm text-foreground list-decimal pl-4">
      {lines.map((l) => (
        <li key={l} className="font-bold leading-snug">
          👉 {l}
        </li>
      ))}
    </ol>
  </div>
);

const Timer = ({ seconds, active }: { seconds: number; active: boolean }) => (
  <div className="glass-card rounded-2xl p-5 border border-primary/40 text-center space-y-1">
    <p className="text-[11px] uppercase tracking-widest text-primary">
      ⏳ Please wait
    </p>
    <p
      className={`font-display text-5xl font-extrabold ${
        active ? "text-primary" : "text-green-500"
      }`}
    >
      {seconds}s
    </p>
    <p className="text-xs text-muted-foreground font-semibold">
      {active ? "Hold on while we verify your visit 👇" : "Done — scroll down and continue 👇"}
    </p>
  </div>
);

const Verify = () => {
  const [params, setParams] = useSearchParams();
  const token = params.get("t") || "";
  const rawStep = Number(params.get("s") || 1);
  const [maxStep, setMaxStep] = useState(1);
  const step = Math.min(Math.max(Number.isFinite(rawStep) ? rawStep : 1, 1), maxStep, 3);

  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const left = useHold(HOLD_SECONDS, step);
  const scrolled = useScrolledToEnd(step);
  const ready = opened && left === 0 && scrolled;

  usePageMeta({
    title: `Step ${step} of 3 — Verify & Unlock Your Movie File | CineRadar`,
    description:
      "Complete 3 quick steps — open the sponsor page, wait a few seconds, confirm — then return to the CineRadar Telegram bot and tap Get File to receive your movie.",
    url: `${SITE_URL}/verify`,
  });

  useEffect(() => {
    setOpened(false);
    window.scrollTo({ top: 0 });
  }, [step]);

  const goStep = useCallback(
    (n: number) => {
      setMaxStep((m) => Math.max(m, n));
      const next = new URLSearchParams(params);
      next.set("s", String(n));
      setParams(next, { replace: false });
    },
    [params, setParams],
  );

  const openSponsor = () => {
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

  const finish = async () => {
    if (!token) {
      setError("This link is missing its code. Start again from the bot.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: fnErr } = await supabase.functions.invoke("unlock", {
      body: { action: "verify", token },
    });
    setBusy(false);
    if (fnErr || (data as any)?.error) {
      setError((data as any)?.error || "Verification failed. Please try again.");
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepCopy = [
    {
      guide: [
        "Tap the blue button below to open the sponsor page in a new tab.",
        "Let it load, then come back to this tab.",
        "Wait for the 10 second timer to finish.",
        "Scroll to the bottom and tap Verify & continue.",
      ],
      button: "Open sponsor page",
    },
    {
      guide: [
        "Tap the blue button to open the second sponsor page.",
        "Return to this tab after it opens.",
        "Wait 10 seconds again — this keeps the bot free.",
        "Scroll down and tap Verify & continue.",
      ],
      button: "Open second sponsor",
    },
    {
      guide: [
        "Tap the blue button one last time.",
        "Wait 10 seconds and scroll to the bottom.",
        "Tap Finish verification to unlock your file.",
        "Then go back to @Cinedbot and tap Get File.",
      ],
      button: "Open final sponsor",
    },
  ][step - 1];

  if (done) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 max-w-xl mx-auto space-y-4">
        <header className="text-center space-y-1">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
          <h1 className="font-display text-xl font-bold text-gradient-gold">
            Verification complete
          </h1>
          <p className="text-sm text-foreground font-bold">
            Now go back to the Telegram bot and tap <b>Get File</b>.
          </p>
        </header>

        <AdSlot slot={AD_SLOTS.headerBanner} minHeight={120} />

        <a
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center rounded-lg bg-primary text-primary-foreground text-base font-bold py-3.5"
        >
          Back to @Cinedbot — Get File
        </a>

        <section className="glass-card rounded-xl p-4 space-y-2">
          <h2 className="font-display text-sm font-bold text-foreground">
            If the file does not arrive
          </h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Open @Cinedbot and tap the <b>Get File</b> button on the last message.</li>
            <li>Your unlock stays valid for 2 hours.</li>
            <li>Expired? Send the movie name again for a fresh link.</li>
          </ul>
        </section>

        <AdsterraIframe />

        <section className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            <h2 className="font-display text-sm font-bold text-foreground">
              What is CineRadar?
            </h2>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Daily Bollywood, Tamil, Telugu, Malayalam and OTT releases.</li>
            <li>Trailer reels and full movie pages with cast and plot.</li>
            <li>Reviews, box office numbers and AI picks made for you.</li>
            <li>A music player with background play and a free study hub.</li>
          </ul>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/50 text-primary text-sm font-semibold py-2.5"
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

        <AdsterraBanner />
        <AdSlot slot={AD_SLOTS.footerBanner} minHeight={250} />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-xl mx-auto space-y-4">
      <header className="text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
        <h1 className="font-display text-xl font-bold text-gradient-gold">
          Step {step} of 3 — verify to unlock
        </h1>
        <Progress step={step} />
        <p className="text-xs text-muted-foreground">
          Finish all 3 steps, then tap <b>Get File</b> inside @Cinedbot.
        </p>
      </header>

      <AdSlot slot={AD_SLOTS.headerBanner} minHeight={120} />

      <Guide lines={stepCopy.guide} />

      <Timer seconds={left} active={opened && left > 0} />

      <button
        onClick={openSponsor}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold py-3"
      >
        {stepCopy.button} <ExternalLink className="w-4 h-4" />
      </button>
      <p className="text-[11px] text-muted-foreground text-center">
        Opens in a new tab. Come back here after it loads.
      </p>

      <AdsterraIframe />

      <section className="glass-card rounded-xl p-4 space-y-2">
        <h2 className="font-display text-sm font-bold text-foreground">
          Why this step?
        </h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Keeps the bot and this site completely free.</li>
          <li>No payment, no signup, no app install.</li>
          <li>Takes about 30 seconds — one time per file.</li>
        </ul>
      </section>

      <AdsterraBanner />

      <section className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm font-bold text-foreground">
            While you wait
          </h2>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Daily Bollywood, Tamil, Telugu and OTT releases.</li>
          <li>Trailer reels, cast, plot and box office numbers.</li>
          <li>Free music player and a study hub.</li>
        </ul>
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
        <h2 className="font-display text-sm font-bold text-foreground">
          Frequently asked
        </h2>
        {FAQS.map((f) => (
          <div key={f.q}>
            <h3 className="text-xs font-semibold text-foreground">{f.q}</h3>
            <p className="text-xs text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </section>

      <AdSlot slot={AD_SLOTS.footerBanner} minHeight={250} />

      <div className="glass-card rounded-xl p-4 border border-primary/40 space-y-2">
        <p className="text-sm font-bold text-foreground">
          {!opened
            ? "👆 Open the sponsor page above to activate this button."
            : left > 0
              ? `⏳ Please wait ${left}s…`
              : !scrolled
                ? "👇 Scroll to the very bottom to unlock the button."
                : step < 3
                  ? "✅ All set — continue to the next step."
                  : "✅ All set — finish your verification."}
        </p>
        <button
          onClick={() => (step < 3 ? goStep(step + 1) : finish())}
          disabled={!ready || busy}
          className="w-full rounded-lg bg-primary text-primary-foreground text-base font-bold py-3.5 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {step < 3 ? "Verify & continue" : "Finish verification"}
          {!busy && (ready ? <ArrowRight className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          onClick={shareLink}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary py-2"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Link copied
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" /> Share this page
            </>
          )}
        </button>
      </div>

      <SiteFooter />
    </div>
  );
};

export default Verify;
