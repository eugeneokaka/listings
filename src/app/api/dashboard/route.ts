import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        listings: { include: { images: true } },
        favorites: {
          include: {
            listing: {
              include: { images: true, owner: true },
            },
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role === "LANDLORD") {
      return NextResponse.json({
        role: user.role,
        listings: user.listings,
      });
    }

    // Normal user — return favorites
    return NextResponse.json({
      role: user.role,
      favorites: user.favorites.map((fav) => fav.listing),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
