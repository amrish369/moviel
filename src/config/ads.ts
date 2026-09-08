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

// Adsterra / PropellerAds: paste the script src given by the network.
// Example Adsterra native banner: "//pl123456.profitablecpmgate.com/xxxxxxxx/invoke.js"
export const ADSTERRA = {
  bannerScriptSrc: "", // social bar / native banner invoke.js URL
  bannerContainerId: "", // e.g. "container-xxxxxxxxxxxxxxxx"
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
];

export const CONTACT_EMAIL = "Yadavamarish11@gmail.com";
export const SITE_NAME = "CineRadar";
export const SITE_URL = "https://moviel.lovable.app";
