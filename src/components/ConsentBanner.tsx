import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const KEY = "cineradar_cookie_consent";

const ConsentBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked */
    }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-3">
      <div className="max-w-3xl mx-auto glass-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-xs text-muted-foreground flex-1">
          We use cookies for site features and to show ads from Google and partners.{" "}
          <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => decide("rejected")}
            className="px-3 py-1.5 rounded-lg text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Reject
          </button>
          <button
            onClick={() => decide("accepted")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
