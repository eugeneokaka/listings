"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white text-black flex items-center justify-between px-6 py-4 shadow-sm border-b">
      {/* Left side - app logo / title */}
      <Link
        href="/"
        className="text-2xl font-bold tracking-tight hover:text-red-600 transition"
      >
        Listings
      </Link>

      {/* Right side - auth and dashboard */}
      <div className="flex items-center gap-4">
        <SignedIn>
          {/* Dashboard button visible only when logged in */}
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Dashboard
          </Link>

          {/* User profile button (no red border) */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10 rounded-full",
              },
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}
