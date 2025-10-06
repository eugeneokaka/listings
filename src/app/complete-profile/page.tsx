"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CompleteProfilePage() {
  const { user } = useUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName || !lastName || !role) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          firstName,
          lastName,
          role,
        }),
      });

      if (res.ok) {
        toast.success("Profile completed successfully!");
        router.push("/");
      } else {
        const err = await res.json();
        toast.error(err?.error || "Error saving profile. Try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg border border-gray-200 rounded-2xl p-8 w-full max-w-md flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Complete Your Profile
        </h1>
        <p className="text-center text-gray-600 text-sm">
          Tell us a bit about yourself to get started.
        </p>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            placeholder="Enter your first name"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Enter your last name"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <div className="flex gap-4">
            <label
              className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition ${
                role === "landlord"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="landlord"
                checked={role === "landlord"}
                onChange={(e) => setRole(e.target.value)}
                className="accent-red-600"
              />
              <span className="text-gray-800">Landlord</span>
            </label>

            <label
              className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition ${
                role === "user" ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === "user"}
                onChange={(e) => setRole(e.target.value)}
                className="accent-red-600"
              />
              <span className="text-gray-800">Normal User</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-2 transition ${
            loading && "opacity-70 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" /> Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </button>
      </form>
    </div>
  );
}
