import { NextResponse } from "next/server";

// Example using your limited maps/places API key
const API_KEY = process.env.MAPS_KEY!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng)
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });

  try {
    const radius = 3000; // 3km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=apartment&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const listings = (data.results || []).map((p: any) => ({
      title: p.name,
      location: p.vicinity,
      distance: (Math.random() * 3 + 0.5).toFixed(1), // fake distance
    }));

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Error fetching places:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
