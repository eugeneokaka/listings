"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

// 🧩 Comment item with reply support
function CommentItem({
  comment,
  onReply,
}: {
  comment: any;
  onReply: (replyContent: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="border p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="w-8 h-8 border">
          <AvatarFallback>
            <div className="w-8 h-8 rounded-full bg-red-600" />
          </AvatarFallback>
        </Avatar>
        <p className="font-medium text-sm">
          {comment.author
            ? `${comment.author.firstname} ${comment.author.lastname}`
            : "Anonymous"}
        </p>
        <span className="text-xs text-gray-400">
          {comment.createdAt
            ? new Date(comment.createdAt).toLocaleDateString()
            : ""}
        </span>
      </div>

      <p className="text-gray-700">{comment.content}</p>

      <button
        onClick={() => setReplying((s) => !s)}
        className="text-xs text-red-600 mt-1 hover:underline"
      >
        Reply
      </button>

      {replying && (
        <div className="mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 border rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              if (!replyText.trim()) return;
              onReply(replyText);
              setReplyText("");
              setReplying(false);
            }}
            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
          >
            Send
          </button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-6 mt-3 space-y-2 border-l pl-3">
          {comment.replies.map((r: any) => (
            <div key={r.id}>
              <p className="text-sm font-medium">
                {r.author
                  ? `${r.author.firstname} ${r.author.lastname}`
                  : "Anonymous"}
              </p>
              <p className="text-gray-700 text-sm">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingPage() {
  const { id } = useParams();
  const { user, isSignedIn } = useUser();

  const [listing, setListing] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // ✉️ Email modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        console.log("📡 Fetching listing:", id);
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load listing");

        setListing({
          ...data,
          images: data.images ?? [],
          amenities: data.amenities ?? [],
          comments: data.comments ?? [],
        });

        console.log("✅ Listing loaded:", data);

        const favRes = await fetch(`/api/favorites/check?listingId=${id}`);
        const favData = await favRes.json();
        if (favRes.ok) setIsFavorite(Boolean(favData.isFavorite));
      } catch (err: any) {
        console.error("❌ Listing fetch error:", err);
        toast.error(err?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleFavorite = async () => {
    if (!isSignedIn) {
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

      setIsFavorite(Boolean(data.isFavorite));
      toast.success(data.message || "Updated favorite");
    } catch (err: any) {
      console.error("❌ Favorite error:", err);
      toast.error(err?.message || "Failed to update favorite");
    } finally {
      setFavLoading(false);
    }
  };

  const postCommentOrReply = async (content: string, parentId?: string) => {
    if (!content.trim()) return null;
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      return data;
    } catch (err: any) {
      console.error("❌ Comment error:", err);
      toast.error(err?.message || "Failed to post comment");
      return null;
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const created = await postCommentOrReply(comment);
    if (!created) return;
    setListing((prev: any) => ({
      ...prev,
      comments: [created, ...(prev?.comments ?? [])],
    }));
    setComment("");
  };

  // ✉️ Send email logic
  const handleSendEmail = async () => {
    console.log("📤 Attempting to send email...");
    if (!senderName || !senderEmail || !message) {
      toast.error("Please fill in all fields");
      console.warn("⚠️ Missing fields", { senderName, senderEmail, message });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSending(true);
      toast.loading("Sending email...");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: listing.owner?.email,
          name: senderName,
          email: senderEmail,
          message,
        }),
      });

      const data = await res.json();
      console.log("📩 Email API response:", data);

      toast.dismiss();

      if (!res.ok) throw new Error(data.error || "Failed to send email");

      toast.success("Email sent successfully!");
      setShowEmailModal(false);
      setSenderName("");
      setSenderEmail("");
      setMessage("");
    } catch (err: any) {
      console.error("❌ Email send error:", err);
      toast.dismiss();
      toast.error(err?.message || "Failed to send email");
    } finally {
      setSending(false);
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
          {(listing.images.length > 0
            ? listing.images
            : [{ id: "placeholder", url: "/placeholder.jpg" }]
          ).map((img: any) => (
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

        {/* 📋 Details */}
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

          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
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
              {(listing.amenities ?? []).map((a: string, i: number) => (
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
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border">
                <AvatarFallback>
                  <div className="w-10 h-10 rounded-full bg-red-600" />
                </AvatarFallback>
              </Avatar>
              <p className="text-gray-700">
                Listed by{" "}
                <span className="font-medium">
                  {listing.owner?.firstname ?? "Unknown"}{" "}
                  {listing.owner?.lastname ?? ""}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p className="text-gray-700">
                <strong>Phone:</strong>{" "}
                {listing.phone ? (
                  <a
                    href={`tel:${listing.phone}`}
                    className="text-red-600 hover:underline ml-1"
                  >
                    {listing.phone}
                  </a>
                ) : (
                  <span className="text-gray-500 ml-1">Not provided</span>
                )}
              </p>

              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Contact Owner
              </button>
            </div>
          </div>
        </div>

        {/* 💬 Comments */}
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

          {(listing.comments ?? []).length === 0 && (
            <p className="text-gray-500">No comments yet.</p>
          )}

          <div className="space-y-4">
            {(listing.comments ?? []).map((c: any) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={async (replyContent: string) => {
                  const created = await postCommentOrReply(replyContent, c.id);
                  if (!created) return;
                  setListing((prev: any) => ({
                    ...prev,
                    comments: prev.comments.map((cm: any) =>
                      cm.id === c.id
                        ? {
                            ...cm,
                            replies: [...(cm.replies ?? []), created],
                          }
                        : cm
                    ),
                  }));
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ✉️ Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-3">Contact Owner</h2>
            <input
              type="text"
              placeholder="Your Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-2"
            />
            <input
              type="email"
              placeholder="Your Email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-2"
            />
            <textarea
              placeholder="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  sending
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
