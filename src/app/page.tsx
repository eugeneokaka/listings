"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    category: "",
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  // 🧮 Helper to format price to KSH
  const formatPrice = (price: number) => {
    return `Ksh ${price.toLocaleString("en-KE", {
      minimumFractionDigits: 0,
    })}`;
  };

  return (
    <main className="min-h-screen bg-white text-black px-6 py-10">
      <section className="max-w-6xl mx-auto">
        {/* 🔍 Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row items-center gap-4 mb-10 bg-gray-50 p-4 rounded-xl shadow-sm border"
        >
          <input
            type="text"
            placeholder="Search by location or area..."
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <input
            type="number"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
            className="w-32 px-3 py-2 border rounded-lg"
          />

          <input
            type="number"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
            className="w-32 px-3 py-2 border rounded-lg"
          />

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="w-36 px-3 py-2 border rounded-lg"
          >
            <option value="">All Types</option>
            <option value="RENTAL">Rental</option>
            <option value="BNB">BnB</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Search
          </button>
        </form>

        {/* 🏠 Listings Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="w-full h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))
          ) : listings.length === 0 ? (
            <p className="text-gray-600 text-center col-span-full">
              No listings found.
            </p>
          ) : (
            listings.map((listing: any) => (
              <div
                key={listing.id}
                className="border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {listing.images?.[0] && (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    width={500}
                    height={300}
                    className="w-full h-56 object-cover"
                  />
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-1">
                    {listing.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {listing.description}
                  </p>

                  {/* 💰 Show price in KSH */}
                  <p className="text-red-600 font-bold mb-1">
                    {formatPrice(listing.price)}
                  </p>

                  {/* 📍 Show area and location */}
                  <p className="text-sm text-gray-700 mb-1">
                    {listing.area ? `${listing.area}, ` : ""}
                    {listing.location}
                  </p>

                  <p className="text-xs text-gray-400 mb-2">
                    {listing.views} views
                  </p>

                  <Link
                    href={`/listings/${listing.id}`}
                    className="mt-3 inline-block text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
