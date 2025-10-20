"use client";

import { useState } from "react";

export default function TestMapSearch() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/find-nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search");
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        🏠 Find Listings Near a Google Maps Location
      </h1>
      <input
        type="text"
        placeholder="Paste Google Maps URL here..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleSearch}
        disabled={!url || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Searching..." : "Find Nearby"}
      </button>

      {error && <p className="text-red-500 mt-3">{error}</p>}

      {results && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">
            Results near ({results.lat}, {results.lng}):
          </h2>
          {results.nearby.length > 0 ? (
            <ul className="space-y-2">
              {results.nearby.map((item: any) => (
                <li key={item.id} className="border p-3 rounded">
                  <strong>{item.title}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No listings found nearby.</p>
          )}
        </div>
      )}
    </div>
  );
}
