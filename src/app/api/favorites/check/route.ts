// app/api/favorites/check/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isFavorite: false });

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) return NextResponse.json({ isFavorite: false });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ isFavorite: false });

    const fav = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    });

    return NextResponse.json({ isFavorite: !!fav });
  } catch {
    return NextResponse.json({ isFavorite: false });
  }
}
