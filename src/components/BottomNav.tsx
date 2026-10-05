import { NavLink } from "react-router-dom";
import { Clapperboard, Music, GraduationCap, Bookmark } from "lucide-react";

const items = [
  { to: "/", label: "Movies", icon: Clapperboard, end: true },
  { to: "/music", label: "Music", icon: Music, end: false },
  { to: "/study", label: "Study", icon: GraduationCap, end: false },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark, end: false },
];

/**
 * Mobile-only bottom navigation bar with large touch targets.
 * Hidden on sm+ where the top header links are reachable.
 * Sits under full-screen overlays (Trailer Reels z-[100], MiniPlayer video z-[90+])
 * but above page content; MiniPlayer (z-[80]) floats above it like a mini-player should.
 */
const BottomNav = () => (
  <>
    {/* Spacer so fixed bar never covers page content */}
    <div
      aria-hidden="true"
      className="sm:hidden h-[calc(60px+env(safe-area-inset-bottom))]"
    />
    <nav
      aria-label="Primary"
      className="sm:hidden fixed bottom-0 inset-x-0 z-[70] border-t border-border bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 h-[60px] min-w-[64px] select-none transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground active:bg-secondary/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
                  {label}
                </span>
                <span
                  className={`h-0.5 w-6 rounded-full transition-opacity ${
                    isActive ? "bg-primary opacity-100" : "opacity-0"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  </>
);

export default BottomNav;
