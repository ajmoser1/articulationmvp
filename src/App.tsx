import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Questionnaire from "./pages/Questionnaire";
import TopicSelection from "./pages/TopicSelection";
import Practice from "./pages/Practice";
import Results from "./pages/Results";
import ProgressPage from "./pages/ResultsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const root = document.documentElement;
    const isLowPerf =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      ("deviceMemory" in navigator && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isLowPerf) {
      root.setAttribute("data-perf", "low");
    }

    const enableTextures = () => root.classList.add("textures-ready");
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => enableTextures());
    } else {
      window.setTimeout(enableTextures, 300);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    const observeExisting = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal='true']")
        .forEach((el) => observer.observe(el));
    };

    observeExisting();

    const mutationObserver = new MutationObserver(() => observeExisting());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeToggle className="fixed top-6 right-6 z-50" />
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/topics" element={<TopicSelection />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/results" element={<Results />} />
            <Route path="/progress" element={<ProgressPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
