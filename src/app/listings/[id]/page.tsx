"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs"; // ✅ Import from Clerk

export default function ListingPage() {
  const { id } = useParams();
  const { user, isSignedIn } = useUser(); // ✅ Clerk user hook

  const [listing, setListing] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load listing");
        setListing(data);

        // ✅ Check if this listing is already in user's favorites
        const favRes = await fetch(`/api/favorites/check?listingId=${id}`);
        const favData = await favRes.json();
        if (favRes.ok) setIsFavorite(favData.isFavorite);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleFavorite = async () => {
    if (!isSignedIn) {
      // ✅ Alert unauthenticated users
      alert("Please login to add listings to your favorites ❤️");
      return;
    }

    try {
      setFavLoading(true);
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update favorite");

      setIsFavorite(data.isFavorite);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFavLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");
      setListing((prev: any) => ({
        ...prev,
        comments: [data, ...prev.comments],
      }));
      setComment("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );

  if (!listing)
    return (
      <div className="text-center text-gray-500 mt-10">Listing not found</div>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid gap-6">
        {/* 🖼️ Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {listing.images.map((img: any) => (
            <Image
              key={img.id}
              src={img.url}
              alt={listing.title}
              width={600}
              height={400}
              className="object-cover rounded-lg"
            />
          ))}
        </div>

        {/* 📋 Title + Details */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold mb-2">{listing.title}</h1>

            <button
              onClick={handleFavorite}
              disabled={favLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isFavorite
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-gray-700"
              }`}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? "fill-white" : "fill-transparent"
                }`}
              />
              {isFavorite ? "Favorited" : "Add to Favorites"}
            </button>
          </div>

          <p className="text-gray-600">{listing.description}</p>

          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500">
            <p>
              <strong>Price:</strong> ${listing.price}
            </p>
            <p>
              <strong>Area:</strong> {listing.area}
            </p>
            <p>
              <strong>Location:</strong> {listing.location}
            </p>
            <p>
              <strong>Category:</strong> {listing.category}
            </p>
            <p>
              <strong>Views:</strong> {listing.views}
            </p>
          </div>

          {/* 🏠 Amenities */}
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Amenities:</h2>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((a: string, i: number) => (
                <span
                  key={i}
                  className="bg-slate-100 px-3 py-1 rounded-full text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* 👤 Owner */}
          <div className="mt-6 flex items-center gap-3">
            <Avatar className="w-10 h-10 border">
              <AvatarFallback>
                <div className="w-10 h-10 rounded-full bg-red-600" />
              </AvatarFallback>
            </Avatar>
            <p className="text-gray-700">
              Listed by{" "}
              <span className="font-medium">
                {listing.owner.firstname} {listing.owner.lastname}
              </span>
            </p>
          </div>
        </div>

        {/* 💬 Comments Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Comments</h2>

          <div className="flex gap-2 mb-4">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              onClick={handleComment}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Post
            </button>
          </div>

          <div className="space-y-4">
            {listing.comments.length === 0 && (
              <p className="text-gray-500">No comments yet.</p>
            )}

            {listing.comments.map((c: any) => (
              <div key={c.id} className="border p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback>
                      <div className="w-8 h-8 rounded-full bg-red-600" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">
                    {c.author
                      ? `${c.author.firstname} ${c.author.lastname}`
                      : "Anonymous"}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
