import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shortUrl = searchParams.get("url");

  if (!shortUrl)
    return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    // Follow redirect manually
    const res = await fetch(shortUrl, { redirect: "follow" });
    const fullUrl = res.url;

    return NextResponse.json({ fullUrl });
  } catch (err) {
    console.error("Expand failed:", err);
    return NextResponse.json({ error: "Failed to expand" }, { status: 500 });
  }
}
