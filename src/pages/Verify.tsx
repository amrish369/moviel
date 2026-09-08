import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdSlot from "@/components/AdSlot";
import AdsterraBanner from "@/components/AdsterraBanner";
import AdsterraIframe from "@/components/AdsterraIframe";
import SiteFooter from "@/components/SiteFooter";
import { ADSTERRA, AD_SLOTS } from "@/config/ads";

const WAIT_SECONDS = 15;

const Verify = () => {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [opened, setOpened] = useState(false);
  const [left, setLeft] = useState(WAIT_SECONDS);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Verify to unlock your movie file | CineRadar";
  }, []);

  useEffect(() => {
    if (!opened || left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [opened, left]);

  const openOffer = () => {
    setOpened(true);
    window.open(ADSTERRA.directLink, "_blank", "noopener");
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
      </header>

      <AdSlot slot={AD_SLOTS.headerBanner} minHeight={120} />

      <Step n={1} title="Open the sponsor page" active={!opened}>
        <button onClick={openOffer} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5">
          Open sponsor <ExternalLink className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-muted-foreground mt-2">Opens in a new tab. Come back here after it loads.</p>
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

      <AdSlot slot={AD_SLOTS.footerBanner} minHeight={250} />
      <SiteFooter />
    </div>
  );
};

export default Verify;
