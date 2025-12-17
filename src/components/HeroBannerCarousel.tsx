import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroMediaType = "image" | "video" | "lottie";

export type HeroMedia = {
  src: string;
  alt?: string;
  type?: HeroMediaType;
  poster?: string;
};

export type HeroSlide = {
  id: string;
  theme?: "default" | "payday" | "diwali" | "offers";
  badge?: string;
  title: string;
  subtitle: string;
  urgency?: string;
  cta: {
    label: string;
    onClick?: () => void;
  };
  media: HeroMedia;
};

type HeroBannerCarouselProps = {
  slides: HeroSlide[];
  autoSlideMs?: number;
  className?: string;
};

const THEME_STYLES: Record<
  NonNullable<HeroSlide["theme"]>,
  { bg: string; cta: string; badge: string }
> = {
  default: {
    bg: "bg-gradient-to-r from-[#3A2257] via-[#6B3FA0] to-[#8456BC]",
    cta: "bg-white text-purple-950 hover:bg-white/90",
    badge: "bg-white/15 text-white ring-1 ring-white/20",
  },
  payday: {
    bg: "bg-gradient-to-r from-[#3A2257] via-[#6B3FA0] to-[#8456BC]",
    cta: "bg-[#FFD54A] text-[#221432] hover:bg-[#FFD54A]/90",
    badge: "bg-[#FFD54A]/20 text-[#FFF4C2] ring-1 ring-[#FFD54A]/25",
  },
  diwali: {
    bg: "bg-gradient-to-r from-[#3A2257] via-[#6B3FA0] to-[#F59E0B]",
    cta: "bg-white text-[#221432] hover:bg-white/90",
    badge: "bg-white/15 text-white ring-1 ring-white/20",
  },
  offers: {
    bg: "bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#22C55E]",
    cta: "bg-white text-[#0B1220] hover:bg-white/90",
    badge: "bg-white/15 text-white ring-1 ring-white/20",
  },
};

function detectMediaType(src: string): HeroMediaType {
  const lower = src.toLowerCase();
  if (lower.endsWith(".json") || lower.includes(".json?")) return "lottie";
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.includes(".mp4?") ||
    lower.includes(".webm?")
  ) {
    return "video";
  }
  return "image";
}

function getSafeAutoplayDelay(delay: number) {
  // Ensure requirement: 4–6 seconds.
  return Math.min(6000, Math.max(4000, delay));
}

function HeroMediaView({
  media,
  shouldRender,
  isPlaying,
  className,
}: {
  media: HeroMedia;
  shouldRender: boolean;
  isPlaying: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const kind = media.type ?? detectMediaType(media.src);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  React.useEffect(() => {
    if (kind !== "video") return;
    const el = videoRef.current;
    if (!el) return;

    if (!isPlaying || reducedMotion) {
      el.pause();
      return;
    }

    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay can be blocked in some environments; keep silent.
      });
    }
  }, [isPlaying, reducedMotion, kind]);

  const [lottieData, setLottieData] = React.useState<any | null>(null);
  const lottieRef = React.useRef<LottieRefCurrentProps | null>(null);

  React.useEffect(() => {
    if (!shouldRender) return;
    if (kind !== "lottie") return;
    if (lottieData) return;

    const controller = new AbortController();

    fetch(media.src, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load lottie: ${r.status}`);
        return r.json();
      })
      .then((json) => setLottieData(json))
      .catch(() => {
        // If the remote lottie fails, we just keep the placeholder.
      });

    return () => controller.abort();
  }, [kind, media.src, shouldRender, lottieData]);

  React.useEffect(() => {
    if (kind !== "lottie") return;
    const ref = lottieRef.current;
    if (!ref) return;

    if (!isPlaying || reducedMotion) {
      ref.pause?.();
    } else {
      ref.play?.();
    }
  }, [isPlaying, reducedMotion, kind]);

  if (!shouldRender) {
    return (
      <div
        className={cn(
          "h-full w-full bg-white/5",
          "ring-1 ring-white/10",
          className,
        )}
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        ref={videoRef}
        className={cn("h-full w-full object-contain", className)}
        muted
        loop
        playsInline
        preload="metadata"
        poster={media.poster}
        // Avoid auto-loading all videos; browser will defer when hidden.
        src={media.src}
      />
    );
  }

  if (kind === "lottie") {
    if (!lottieData) {
      return (
        <div
          className={cn(
            "h-full w-full bg-white/5 ring-1 ring-white/10",
            className,
          )}
        />
      );
    }

    return (
      <Lottie
        lottieRef={lottieRef}
        animationData={lottieData}
        loop
        autoplay={!reducedMotion}
        className={cn("h-full w-full", className)}
      />
    );
  }

  // image / gif
  return (
    <img
      src={media.src}
      alt={media.alt ?? ""}
      className={cn("h-full w-full object-contain", className)}
      loading="lazy"
      decoding="async"
    />
  );
}

export function HeroBannerCarousel({
  slides,
  autoSlideMs = 5000,
  className,
}: HeroBannerCarouselProps) {
  const safeDelay = getSafeAutoplayDelay(autoSlideMs);

  const autoplay = React.useRef(
    Autoplay({
      delay: safeDelay,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const { ref: inViewRef, inView } = useInView({ threshold: 0.35 });

  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!api) return;

    setScrollSnaps(api.scrollSnapList());

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!autoplay.current) return;
    if (!inView) {
      autoplay.current.stop?.();
    } else {
      autoplay.current.play?.();
    }
  }, [inView]);

  const onPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const onNext = React.useCallback(() => api?.scrollNext(), [api]);

  const getTheme = (theme?: HeroSlide["theme"]) =>
    THEME_STYLES[theme ?? "default"];

  return (
    <section
      ref={inViewRef}
      className={cn("w-full", className)}
      aria-label="Promotional banners"
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[autoplay.current]}
        className="relative"
      >
        <CarouselContent>
          {slides.map((slide, idx) => {
            const theme = getTheme(slide.theme);
            const isActive = idx === selectedIndex;
            const isNeighbor =
              idx === selectedIndex ||
              idx === (selectedIndex + 1) % slides.length ||
              idx === (selectedIndex - 1 + slides.length) % slides.length;

            return (
              <CarouselItem key={slide.id}>
                <div
                  className={cn(
                    "relative overflow-hidden",
                    "rounded-[20px] sm:rounded-[24px]",
                    "shadow-[0_18px_60px_rgba(107,63,160,0.28)]",
                    theme.bg,
                  )}
                >
                  {/* Soft glow */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20" />

                  {/* Floating ornaments */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl"
                    animate={inView ? { y: [0, 10, 0] } : { y: 0 }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-3xl"
                    animate={inView ? { y: [0, -12, 0] } : { y: 0 }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Layout grid */}
                  <div
                    className={cn(
                      "relative grid grid-cols-1 md:grid-cols-2",
                      "gap-6 sm:gap-8",
                      "p-5 sm:p-8",
                      "items-center",
                    )}
                  >
                    {/* Content */}
                    <div className="text-white">
                      <div className="flex flex-wrap items-center gap-2">
                        {slide.badge && (
                          <Badge className={cn("rounded-full px-3 py-1", theme.badge)}>
                            {slide.badge}
                          </Badge>
                        )}
                        {slide.urgency && (
                          <span className="text-xs sm:text-sm text-white/80">
                            {slide.urgency}
                          </span>
                        )}
                      </div>

                      <motion.h2
                        className={cn(
                          "mt-3",
                          "text-3xl sm:text-4xl lg:text-5xl",
                          "font-extrabold tracking-tight",
                        )}
                        initial={false}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.9, y: 0 }}
                      >
                        {slide.title}
                      </motion.h2>

                      <p className="mt-3 max-w-xl text-sm sm:text-base lg:text-lg text-white/90">
                        {slide.subtitle}
                      </p>

                      <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={slide.cta.onClick}
                          className={cn(
                            "h-11 rounded-full px-6",
                            "shadow-[0_12px_30px_rgba(0,0,0,0.25)]",
                            "transition-transform hover:scale-[1.02] active:scale-[0.98]",
                            theme.cta,
                          )}
                        >
                          {slide.cta.label}
                        </Button>
                      </div>

                      <p className="mt-4 text-xs text-white/70">
                        Swipe for more offers
                      </p>
                    </div>

                    {/* Media */}
                    <div
                      className={cn(
                        "relative",
                        "aspect-[4/5] sm:aspect-video",
                        "rounded-2xl",
                        "bg-white/10",
                        "ring-1 ring-white/20",
                        "overflow-hidden",
                      )}
                    >
                      <HeroMediaView
                        media={slide.media}
                        shouldRender={isNeighbor}
                        isPlaying={inView && isActive}
                        className="p-3 sm:p-4"
                      />
                    </div>

                    {/* In-banner navigation */}
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-3 sm:px-4">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className={cn(
                          "pointer-events-auto",
                          "rounded-full bg-white/15 text-white",
                          "hover:bg-white/25",
                          "ring-1 ring-white/20",
                        )}
                        onClick={onPrev}
                        aria-label="Previous banner"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className={cn(
                          "pointer-events-auto",
                          "rounded-full bg-white/15 text-white",
                          "hover:bg-white/25",
                          "ring-1 ring-white/20",
                        )}
                        onClick={onNext}
                        aria-label="Next banner"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Dots */}
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                      {scrollSnaps.map((_, dotIdx) => {
                        const active = dotIdx === selectedIndex;
                        return (
                          <button
                            key={dotIdx}
                            type="button"
                            className={cn(
                              "h-2 rounded-full transition-all",
                              active ? "w-8 bg-white" : "w-3 bg-white/45",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                            )}
                            aria-label={`Go to banner ${dotIdx + 1}`}
                            aria-current={active}
                            onClick={() => api?.scrollTo(dotIdx)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
