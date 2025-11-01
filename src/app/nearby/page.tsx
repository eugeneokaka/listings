"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// 🧭 Known test locations
const kabarak = {
  name: "Kabarak University Nakuru Town Campus",
  lat: -0.2783305,
  lng: 36.0584324,
};
const hyrax = { name: "Hyrax Hill Museum", lat: -0.2796436, lng: 36.1054276 };

// 🌍 Haversine distance formula (in km)
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 🧠 Extract coordinates from Google Maps URL
function extractCoordinates(url: string) {
  // Try @lat,lng pattern
  let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  // Try !3dlat!4dlng pattern
  match = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  return null;
}

export default function NearbyTestPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleCheck() {
    setLoading(true);
    setResult(null);

    try {
      const coords = extractCoordinates(url);
      if (!coords) throw new Error("No coordinates found in URL");

      const { lat, lng } = coords;

      // Compare distances
      const distKabarak = distance(lat, lng, kabarak.lat, kabarak.lng);
      const distHyrax = distance(lat, lng, hyrax.lat, hyrax.lng);

      const closer =
        distKabarak < distHyrax
          ? { name: kabarak.name, distance: distKabarak.toFixed(3) }
          : { name: hyrax.name, distance: distHyrax.toFixed(3) };

      setResult({
        input: { lat, lng },
        all: {
          kabarak: distKabarak.toFixed(3),
          hyrax: distHyrax.toFixed(3),
        },
        closer,
      });
    } catch (err) {
      console.error(err);
      alert("Could not read coordinates from that URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Which Is Closer</h1>

      <input
        type="text"
        placeholder="Paste a Google Maps URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border rounded p-2 mb-3 text-black"
      />

      <button
        onClick={handleCheck}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Checking..." : "Check Distance"}
      </button>

      <div className="mt-6">
        {result && (
          <div className="border p-4 rounded bg-gray-800">
            <h2 className="font-semibold mb-2">Result</h2>
            <p>
              <b>Detected coords:</b> {result.input.lat.toFixed(6)},{" "}
              {result.input.lng.toFixed(6)}
            </p>
            <p>
              <b>Kabarak distance:</b> {result.all.kabarak} km
            </p>
            <p>
              <b>Hyrax distance:</b> {result.all.hyrax} km
            </p>
            <p className="mt-2 text-green-400 font-semibold">
              📍 Closest: {result.closer.name} ({result.closer.distance} km)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
