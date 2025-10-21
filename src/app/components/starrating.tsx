"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function StarRating({ listingId }: { listingId: string }) {
  const { isSignedIn } = useUser();
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);

  const fetchRating = async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}/rating`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAverage(data.average);
      setCount(data.count);
      setRating(data.userRating);
    } catch (err) {
      console.error("❌ Failed to load rating:", err);
    }
  };

  const submitRating = async (value: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate.");
      return;
    }

    try {
      const res = await fetch(`/api/listings/${listingId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save rating");

      toast.success("Thanks for rating!");
      setRating(value);
      setAverage(data.average);
      setCount(data.count);
    } catch (err: any) {
      console.error("❌ Rating submit error:", err);
      toast.error(err?.message || "Failed to rate");
    }
  };

  useEffect(() => {
    fetchRating();
  }, []);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <Star
            key={val}
            className={`w-6 h-6 cursor-pointer transition
              ${
                (hover ?? rating ?? 0) >= val
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            onMouseEnter={() => setHover(val)}
            onMouseLeave={() => setHover(null)}
            onClick={() => submitRating(val)}
          />
        ))}
      </div>

      <p className="text-sm text-gray-600 mt-1">
        Average: <span className="font-medium">{average.toFixed(1)}</span> ⭐ (
        {count} {count === 1 ? "rating" : "ratings"})
      </p>
    </div>
  );
}
