"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UploadThingButton from "../../components/upladbutton"; // ✅ adjust if needed

interface ListingImage {
  id: string;
  url: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  area: string;
  location: string;
  category: string;
  isAvailable: boolean;
  images: ListingImage[];
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // ✅ loading state
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  // 🧠 Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setListing(data);
        setImages(data.images.map((img: ListingImage) => ({ url: img.url })));
      } catch (err: any) {
        toast.error(err.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.id]);

  // 💾 Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setSaving(true);

    try {
      // Identify truly new images (not already in listing)
      const existingUrls = listing.images.map((img) => img.url);
      const newImages = images
        .filter((img) => !existingUrls.includes(img.url))
        .map((img) => img.url);

      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...listing,
          newImages, // ✅ send only new images
          deletedImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Listing updated successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!listing) return <p className="text-center mt-10">Listing not found</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={listing.title}
          onChange={(e) => setListing({ ...listing, title: e.target.value })}
          placeholder="Title"
          className="w-full border p-2 rounded-lg"
        />

        <textarea
          value={listing.description}
          onChange={(e) =>
            setListing({ ...listing, description: e.target.value })
          }
          placeholder="Description"
          className="w-full border p-2 rounded-lg"
          rows={4}
        />

        <input
          type="number"
          value={listing.price}
          onChange={(e) =>
            setListing({ ...listing, price: parseFloat(e.target.value) })
          }
          placeholder="Price"
          className="w-full border p-2 rounded-lg"
        />

        <input
          type="text"
          value={listing.area}
          onChange={(e) => setListing({ ...listing, area: e.target.value })}
          placeholder="Area"
          className="w-full border p-2 rounded-lg"
        />

        <input
          type="text"
          value={listing.location}
          onChange={(e) => setListing({ ...listing, location: e.target.value })}
          placeholder="Location"
          className="w-full border p-2 rounded-lg"
        />

        <select
          value={listing.category}
          onChange={(e) => setListing({ ...listing, category: e.target.value })}
          className="w-full border p-2 rounded-lg"
        >
          <option value="RENTAL">Rental</option>
          <option value="BNB">BnB</option>
          <option value="HALL">Hall</option>
          <option value="CONFERENCE">Conference</option>
          <option value="EVENT_SPACE">Event Space</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">Available:</label>
          <input
            type="checkbox"
            checked={listing.isAvailable}
            onChange={(e) =>
              setListing({ ...listing, isAvailable: e.target.checked })
            }
          />
        </div>

        {/* ✅ UploadThing Component */}
        <div className="mt-4">
          <p className="font-medium text-gray-700 mb-2">Images</p>
          <UploadThingButton
            images={images}
            setImages={(imgs) => {
              if (!listing) return;
              // Track removed images
              const removed = listing.images.filter(
                (img) => !imgs.some((newImg) => newImg.url === img.url)
              );
              if (removed.length > 0) {
                setDeletedImages([
                  ...deletedImages,
                  ...removed.map((r) => r.id),
                ]);
              }
              setImages(imgs);
            }}
          />
        </div>

        {/* 💾 Save Button with Loading */}
        <Button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </main>
  );
}
