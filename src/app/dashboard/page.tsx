"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  area: string;
  location: string;
  images: { url: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();

        if (!res.ok) {
          toast.error(json.error || "Failed to load dashboard");
          return;
        }

        setData(json);
      } catch (err) {
        toast.error("Error fetching dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No data found.</p>
      </div>
    );

  const { role, listings, favorites } = data;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          {role === "LANDLORD" ? "Your Listings" : "Your Favorites"}
        </h1>
        {role === "LANDLORD" && (
          <Button
            onClick={() => router.push("/listings/create")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            + Create Listing
          </Button>
        )}
      </div>

      {/* Listings / Favorites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(role === "LANDLORD" ? listings : favorites)?.length === 0 && (
          <p className="text-gray-500">
            {role === "LANDLORD"
              ? "You have no listings yet."
              : "You have no favorites yet."}
          </p>
        )}

        {(role === "LANDLORD" ? listings : favorites)?.map(
          (listing: Listing) => (
            <Card
              key={listing.id}
              className="border border-gray-200 hover:shadow-lg transition rounded-xl overflow-hidden"
            >
              {listing.images[0] && (
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              )}

              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 hover:text-red-600 transition">
                  {listing.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 line-clamp-2 mb-2">
                  {listing.description}
                </p>
                <p className="font-medium text-red-600">
                  KES {listing.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {listing.area} • {listing.location}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {/* View Details */}
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => router.push(`/listings/${listing.id}`)}
                  >
                    View
                  </Button>

                  {/* Edit */}
                  {role === "LANDLORD" && (
                    <Button
                      variant="outline"
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push(`/edit/${listing.id}`)}
                    >
                      Edit
                    </Button>
                  )}

                  {/* Book */}
                  {role === "LANDLORD" && (
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => router.push(`/bookings/${listing.id}`)}
                    >
                      Book
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
