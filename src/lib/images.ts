/**
 * ImageService — unified photography provider for VisFit.
 *
 * Priority: Unsplash -> Pexels -> Wikimedia Commons -> null (no image).
 * Unsplash/Pexels need API keys; Wikimedia Commons is a free, keyless,
 * openly-licensed source used so the app always has real photography even
 * with zero configuration. The UI never talks to any provider directly; it
 * always goes through `getImage()` (server-side, used by `/api/images`) so
 * API keys never reach the client and a provider outage never breaks the
 * UI. If every provider fails, `getImage()` resolves to `null` and the UI
 * renders a clean empty state instead of a fabricated placeholder image.
 */

export type ImageOrientation = "landscape" | "portrait" | "square";

export interface ImageResult {
  url: string;
  width?: number;
  height?: number;
  photographer: string | null;
  photographerUrl: string | null;
  source: "unsplash" | "pexels" | "wikimedia";
  attribution: string | null;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — keeps API usage minimal
const cache = new Map<string, { at: number; value: ImageResult | null }>();

function cacheKey(query: string, orientation: ImageOrientation) {
  return `${orientation}:${query.trim().toLowerCase()}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fromUnsplash(
  query: string,
  orientation: ImageOrientation,
): Promise<ImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", orientation);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("content_filter", "high");
    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        urls: { regular: string; small: string };
        width: number;
        height: number;
        user: { name: string; links: { html: string } };
        links: { html: string };
      }>;
    };
    const hit = data.results?.[0];
    if (!hit) return null;
    return {
      url: hit.urls.regular,
      width: hit.width,
      height: hit.height,
      photographer: hit.user.name,
      photographerUrl: hit.user.links.html,
      source: "unsplash",
      attribution: `Photo by ${hit.user.name} on Unsplash`,
    };
  } catch {
    return null;
  }
}

async function fromPexels(
  query: string,
  orientation: ImageOrientation,
): Promise<ImageResult | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set(
      "orientation",
      orientation === "square" ? "square" : orientation,
    );
    url.searchParams.set("per_page", "1");
    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: key },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos?: Array<{
        src: { large: string };
        width: number;
        height: number;
        photographer: string;
        photographer_url: string;
      }>;
    };
    const hit = data.photos?.[0];
    if (!hit) return null;
    return {
      url: hit.src.large,
      width: hit.width,
      height: hit.height,
      photographer: hit.photographer,
      photographerUrl: hit.photographer_url,
      source: "pexels",
      attribution: `Photo by ${hit.photographer} on Pexels`,
    };
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

interface WikimediaImageInfo {
  url: string;
  thumburl?: string;
  width: number;
  height: number;
  thumbwidth?: number;
  thumbheight?: number;
  extmetadata?: {
    Artist?: { value: string };
    LicenseShortName?: { value: string };
  };
}

async function searchWikimedia(searchTerm: string): Promise<WikimediaImageInfo[]> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${searchTerm} filetype:bitmap`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|size");
  url.searchParams.set("iiurlwidth", "1400");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetchWithTimeout(url.toString(), {
    headers: { "User-Agent": "VisFit/1.0 (fitness app; contact via app repo)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { imageinfo?: WikimediaImageInfo[] }> };
  };
  const pages = data.query?.pages ? Object.values(data.query.pages) : [];
  return pages
    .map((p) => p.imageinfo?.[0])
    .filter((info): info is WikimediaImageInfo => !!info);
}

async function fromWikimedia(
  query: string,
  orientation: ImageOrientation,
): Promise<ImageResult | null> {
  try {
    let candidates = await searchWikimedia(query);

    // Multi-word queries sometimes over-constrain Commons' search index.
    // Retry with just the first couple of words before giving up.
    if (candidates.length === 0) {
      const words = query.trim().split(/\s+/);
      if (words.length > 2) {
        candidates = await searchWikimedia(words.slice(0, 2).join(" "));
      }
    }
    if (candidates.length === 0) return null;

    const wantsWide = orientation === "landscape";
    const wantsTall = orientation === "portrait";
    const match =
      candidates.find((c) => {
        const w = c.thumbwidth ?? c.width;
        const h = c.thumbheight ?? c.height;
        if (wantsWide) return w >= h;
        if (wantsTall) return h >= w;
        return true;
      }) ?? candidates[0];

    const artist = match.extmetadata?.Artist?.value
      ? stripHtml(match.extmetadata.Artist.value)
      : null;
    const license = match.extmetadata?.LicenseShortName?.value ?? null;

    return {
      url: match.thumburl ?? match.url,
      width: match.thumbwidth ?? match.width,
      height: match.thumbheight ?? match.height,
      photographer: artist,
      photographerUrl: null,
      source: "wikimedia",
      attribution: artist
        ? `${artist} · Wikimedia Commons${license ? ` (${license})` : ""}`
        : "Wikimedia Commons",
    };
  } catch {
    return null;
  }
}

/**
 * Resolve a photograph for `query`. Never throws — resolves to an
 * `ImageResult` on success, or `null` when every provider (Unsplash,
 * Pexels, Wikimedia Commons) fails to return a result.
 */
export async function getImage(opts: {
  query: string;
  orientation?: ImageOrientation;
}): Promise<ImageResult | null> {
  const orientation = opts.orientation ?? "landscape";
  const key = cacheKey(opts.query, orientation);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const result =
    (await fromUnsplash(opts.query, orientation)) ??
    (await fromPexels(opts.query, orientation)) ??
    (await fromWikimedia(opts.query, orientation)) ??
    null;

  cache.set(key, { at: Date.now(), value: result });
  return result;
}
