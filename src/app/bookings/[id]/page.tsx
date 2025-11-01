"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  const { id } = useParams();
  const listingId = id as string;

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    price: "",
    eventType: "",
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          ...form,
          price: parseFloat(form.price),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Booking created successfully!");
        router.push("/dashboard");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    try {
      const newAvailability = !isAvailable;
      setIsAvailable(newAvailability);

      await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, isAvailable: newAvailability }),
      });
    } catch (error) {
      console.error("Failed to toggle availability", error);
      alert("Failed to update availability.");
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 tracking-tight">
          Book This Listing
        </h2>

        <form onSubmit={handleBooking} className="space-y-4">
          <input
            type="text"
            placeholder="First Name"
            value={form.firstname}
            onChange={(e) => setForm({ ...form, firstname: e.target.value })}
            className="w-full border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 rounded-lg p-3 outline-none transition"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastname}
            onChange={(e) => setForm({ ...form, lastname: e.target.value })}
            className="w-full border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 rounded-lg p-3 outline-none transition"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 rounded-lg p-3 outline-none transition"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 rounded-lg p-3 outline-none transition"
            required
          />
          <input
            type="text"
            placeholder="Event Type (optional)"
            value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            className="w-full border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 rounded-lg p-3 outline-none transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold tracking-wide shadow-md hover:shadow-lg"
          >
            {loading ? "Booking..." : "Book Now"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between border-t pt-5">
          <span
            className={`font-medium text-sm ${
              isAvailable ? "text-green-600" : "text-red-600"
            }`}
          >
            {isAvailable ? "Available" : "Not Available"}
          </span>

          <button
            onClick={toggleAvailability}
            className={`relative w-14 h-7 flex items-center rounded-full transition-all duration-300 shadow-inner ${
              isAvailable ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <span
              className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                isAvailable ? "translate-x-7" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>
      </div>
    </div>
  );
}
