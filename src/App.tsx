import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MovieDetail from "./pages/MovieDetail.tsx";
import ActorDetail from "./pages/ActorDetail.tsx";
import Auth from "./pages/Auth.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./hooks/useAuth";
import Music from "./pages/Music.tsx";
import Study from "./pages/Study.tsx";
import ArtistDetail from "./pages/ArtistDetail.tsx";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import MiniPlayer from "./components/MiniPlayer";
import ConsentBanner from "./components/ConsentBanner";
import AdsterraScripts from "./components/AdsterraScripts";
import Verify from "./pages/Verify.tsx";
import { Privacy, Terms, About, Contact, Disclaimer } from "./pages/Legal.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MusicPlayerProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/movie" element={<MovieDetail />} />
              <Route path="/actor" element={<ActorDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/music" element={<Music />} />
              <Route path="/study" element={<Study />} />
              <Route path="/artist-music" element={<ArtistDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/verify" element={<Verify />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MiniPlayer />
            <ConsentBanner />
            <AdsterraScripts />
          </MusicPlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
