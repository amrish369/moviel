// Central ad configuration. Change values here, nothing else.

export const ADSENSE_CLIENT = "ca-pub-5978695959746367";

// AdSense ad unit slot IDs (create units in your AdSense dashboard and paste IDs here).
// Until real slot IDs are added, units render in "auto/responsive" mode.
export const AD_SLOTS = {
  headerBanner: "",
  inFeed: "",
  sidebar: "",
  footerBanner: "",
  article: "",
};

// Adsterra ad codes (live).
export const ADSTERRA = {
  // Native banner
  bannerScriptSrc:
    "https://pl31250447.profitableratecpmnetwork.com/a534aac8aba39c4256285a3535dccd04/invoke.js",
  bannerContainerId: "container-a534aac8aba39c4256285a3535dccd04",
  // Social bar
  socialBarSrc:
    "https://pl31250448.profitableratecpmnetwork.com/3d/60/c8/3d60c8802581afc942d0afd737c52f91.js",
  // Popunder
  popunderSrc:
    "https://pl31250445.profitableratecpmnetwork.com/55/fd/c0/55fdc0be1a580a7e4b5dfe2bbf173a28.js",
  // Fixed-size iframe banner (160x300)
  iframe: {
    key: "a194b20cc11a59b2ab9d8082318e2209",
    width: 160,
    height: 300,
    invokeSrc:
      "https://www.highrevenueformat.com/a194b20cc11a59b2ab9d8082318e2209/invoke.js",
  },
  // Direct link (used as an affiliate-style offer)
  directLink:
    "https://www.profitableratecpmnetwork.com/kv0ir4e3p8?key=44563c406b1eff63688d9294d80b762d",
};

// Affiliate banners shown between content. Add/remove freely.
export type AffiliateOffer = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  emoji: string;
};

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: "prime",
    title: "Amazon Prime Video",
    subtitle: "30-day free trial — thousands of Bollywood & South movies",
    cta: "Start free trial",
    url: "https://www.amazon.in/primevideo",
    emoji: "🎬",
  },
  {
    id: "vpn",
    title: "Stream faster & safer",
    subtitle: "Get a high-speed VPN for buffer-free streaming",
    cta: "Get deal",
    url: "https://nordvpn.com/",
    emoji: "🛡️",
  },
  {
    id: "telegram",
    title: "CineRadar Telegram",
    subtitle: "Get instant alerts for every new release",
    cta: "Join now",
    url: "https://t.me/Cinedbot",
    emoji: "📲",
  },
  {
    id: "adsterra-direct",
    title: "Sponsored offer",
    subtitle: "Exclusive deals from our advertising partner",
    cta: "View offer",
    url: ADSTERRA.directLink,
    emoji: "✨",
  },
];

export const CONTACT_EMAIL = "Yadavamarish11@gmail.com";
export const SITE_NAME = "CineRadar";
export const SITE_URL = "https://moviel.lovable.app";
