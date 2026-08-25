"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import type { ImageOrientation, ImageResult } from "@/lib/images";

interface SmartImageProps {
  /** Search query passed to the ImageService, e.g. "strength training modern gym" */
  query: string;
  orientation?: ImageOrientation;
  alt: string;
  className?: string;
  /** Load eagerly (hero / above-the-fold imagery). Defaults to lazy. */
  priority?: boolean;
  /** Show photographer/source attribution caption in the corner. */
  showAttribution?: boolean;
}

/**
 * Renders a photograph resolved through the server-side ImageService
 * (Unsplash -> Pexels). Always shows a graceful loading/error state —
 * never a broken <img>, and never a fabricated placeholder image.
 */
export function SmartImage({
  query,
  orientation = "landscape",
  alt,
  className,
  priority = false,
  showAttribution = false,
}: SmartImageProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [image, setImage] = useState<ImageResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset state when query/orientation changes
    setState("loading");
    fetch(`/api/images?q=${encodeURIComponent(query)}&orientation=${orientation}`)
      .then((res) => {
        if (!res.ok) throw new Error("image fetch failed");
        return res.json() as Promise<{ image: ImageResult | null }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!data.image) {
          setState("error");
          return;
        }
        setImage(data.image);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [query, orientation]);

  if (state === "error") {
    return (
      <div
        className={cn(
          "grid place-items-center bg-muted text-muted-foreground",
          className,
        )}
        aria-label={alt}
      >
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setState("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            state === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {state === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {showAttribution && image?.attribution && (
        <a
          href={image.photographerUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium text-white/80 backdrop-blur-sm hover:text-white"
        >
          {image.attribution}
        </a>
      )}
    </div>
  );
}
