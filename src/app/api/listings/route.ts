import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET — Fetch listings with filters (max 8)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const location = searchParams.get("location") || undefined;
    const category = searchParams.get("category") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;

    const whereClause: any = {};

    if (location) {
      whereClause.OR = [
        { location: { contains: location, mode: "insensitive" } },
        { area: { contains: location, mode: "insensitive" } },
      ];
    }

    if (category) whereClause.category = category;
    if (minPrice)
      whereClause.price = { ...(whereClause.price || {}), gte: minPrice };
    if (maxPrice)
      whereClause.price = { ...(whereClause.price || {}), lte: maxPrice };

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: { images: true, owner: true },
      orderBy: { createdAt: "desc" },
      take: 8, // ⬅️ limit results to 8
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// ✅ POST — Create a new listing (only for landlords)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      description,
      category,
      price,
      area,
      location,
      phone,
      mapUrl,
      amenities,
      imageUrls,
    } = body;

    if (
      !title ||
      !description ||
      !category ||
      !price ||
      !area ||
      !location ||
      !phone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Only landlords can create listings." },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price),
        area,
        location,
        phone,
        mapUrl,
        amenities,
        ownerId: user.id,
        images: {
          create: imageUrls.map((url: string) => ({ url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
