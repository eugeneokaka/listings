// app/api/favorites/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Add or Remove favorite
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { listingId } = body;

    if (!listingId)
      return NextResponse.json(
        { error: "Listing ID required" },
        { status: 400 }
      );

    // Get the user
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({
        message: "Removed from favorites",
        isFavorite: false,
      });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId: user.id,
        listingId,
      },
    });

    return NextResponse.json({
      message: "Added to favorites",
      isFavorite: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
