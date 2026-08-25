import { NextResponse } from "next/server";
import { getImage, type ImageOrientation } from "@/lib/images";

export const runtime = "nodejs";

const ORIENTATIONS: ImageOrientation[] = ["landscape", "portrait", "square"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const orientationParam = url.searchParams.get("orientation") ?? "landscape";
  const orientation: ImageOrientation = ORIENTATIONS.includes(
    orientationParam as ImageOrientation,
  )
    ? (orientationParam as ImageOrientation)
    : "landscape";

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // getImage() never throws — it resolves to an ImageResult (Unsplash ->
  // Pexels) or null when neither provider produces a result. Either way
  // this route responds 200 so the client can render a clean empty state
  // instead of erroring.
  const image = await getImage({ query, orientation });
  return NextResponse.json(
    { image },
    {
      headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600" },
    },
  );
}
