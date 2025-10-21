import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ POST — create or update rating
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rate } = await req.json();
    if (!rate || rate < 1 || rate > 5)
      return NextResponse.json(
        { error: "Invalid rating value" },
        { status: 400 }
      );

    const listingId = id;

    // Find current user record
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Upsert (create or update) user’s rating
    const rating = await prisma.rating.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      update: { rate },
      create: { userId: user.id, listingId, rate },
    });

    // Recalculate average
    const stats = await prisma.rating.aggregate({
      where: { listingId },
      _avg: { rate: true },
      _count: { rate: true },
    });

    return NextResponse.json({
      message: "Rating saved",
      rating,
      average: stats._avg.rate ?? 0,
      count: stats._count.rate,
    });
  } catch (err: any) {
    console.error("❌ Rating API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ GET — fetch average + count + (optional) user’s rating
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const { userId } = await auth();
    const listingId = id;

    const stats = await prisma.rating.aggregate({
      where: { listingId },
      _avg: { rate: true },
      _count: { rate: true },
    });

    let userRating = null;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { clerkId: userId } });
      if (user) {
        const found = await prisma.rating.findUnique({
          where: { userId_listingId: { userId: user.id, listingId } },
        });
        userRating = found?.rate ?? null;
      }
    }

    return NextResponse.json({
      average: stats._avg.rate ?? 0,
      count: stats._count.rate,
      userRating,
    });
  } catch (err: any) {
    console.error("❌ Rating fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
