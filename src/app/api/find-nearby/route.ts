import { NextResponse } from "next/server";
const olc = require("olc");

type Listing = {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
};

// Hardcoded listings near Nakuru
const listings: Listing[] = [
  {
    id: 1,
    title: "Kabarak University Town Campus",
    latitude: -0.2838,
    longitude: 36.0725,
  },
  {
    id: 2,
    title: "Hyrax Hill Museum",
    latitude: -0.2736,
    longitude: 36.1121,
  },
];

// Distance formula (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractCoords(url: string): { lat: number; lng: number } | null {
  const match = url.match(/@([-.\d]+),([-.\d]+)/);
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

  const qMatch = url.match(/[?&]q=([-.\d]+),([-.\d]+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  return null;
}

function extractPlaceName(url: string) {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/maps\/place\/([^/]+)/);
    if (match) return match[1].replace(/\+/g, " ");
  } catch {}
  return null;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    let coords: { lat: number; lng: number } | null = extractCoords(url);

    // ✅ Step 1: Try decoding Plus Code (e.g. P3C5+M97)
    if (!coords) {
      const plusCodeMatch = url.match(/([A-Z0-9]{4,}\+[A-Z0-9]{2,})/i);
      if (plusCodeMatch) {
        try {
          const decoded = olc.decode(plusCodeMatch[1]);
          coords = {
            lat: decoded.latitudeCenter,
            lng: decoded.longitudeCenter,
          };
        } catch (err) {
          console.error("Plus code decode failed", err);
        }
      }
    }

    // 🧭 Step 2: If still no coordinates, try OpenStreetMap
    if (!coords) {
      const place = extractPlaceName(url);
      if (place) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            place
          )}&format=json`
        );
        const data = await response.json();
        if (data && data[0]) {
          coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }

    if (!coords) {
      return NextResponse.json(
        { error: "Could not extract or find coordinates" },
        { status: 400 }
      );
    }

    const { lat, lng } = coords;

    // Find nearby listings (within 5 km)
    const nearby = listings.filter(
      (item) => getDistance(lat, lng, item.latitude, item.longitude) <= 5
    );

    return NextResponse.json({ lat, lng, nearby });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
