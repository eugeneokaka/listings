"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">No data found.</p>
      </div>
    );

  const { role, listings, favorites } = data;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
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

      {/* Listings or Favorites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(role === "LANDLORD" ? listings : favorites)?.length === 0 && (
          <p className="text-muted-foreground">
            {role === "LANDLORD"
              ? "You have no listings yet."
              : "You have no favorites yet."}
          </p>
        )}

        {(role === "LANDLORD" ? listings : favorites)?.map(
          (listing: Listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group"
            >
              <Card className="border border-border/50 hover:shadow-lg transition cursor-pointer">
                {listing.images[0] && (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:opacity-90 transition"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-semibold group-hover:text-red-600 transition">
                    {listing.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">
                    {listing.description}
                  </p>
                  <p className="mt-2 font-medium text-red-600">
                    KES {listing.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.area} • {listing.location}
                  </p>

                  <Button
                    variant="outline"
                    className="w-full mt-4 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
