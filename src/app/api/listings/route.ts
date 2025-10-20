import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET — Fetch listings with filters (max 6) and include owner email
export async function GET(req: Request) {
  console.log("Received GET request for listings with filters");
  try {
    const { searchParams } = new URL(req.url);

    const clean = (v: string | null) =>
      v ? v.trim().replace(/\s+/g, " ").toLowerCase() : undefined;

    const city = clean(searchParams.get("city"));
    const area = clean(searchParams.get("area"));
    const category = clean(searchParams.get("category"));
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;

    const whereClause: any = {};

    if (city) whereClause.location = { contains: city, mode: "insensitive" };
    if (area) whereClause.area = { contains: area, mode: "insensitive" };
    if (category) whereClause.category = category;
    if (minPrice)
      whereClause.price = { ...(whereClause.price || {}), gte: minPrice };
    if (maxPrice)
      whereClause.price = { ...(whereClause.price || {}), lte: maxPrice };

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        images: true,
        owner: {
          select: { email: true, id: true }, // ✅ include email
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    console.log("Fetched listings:", listings[0]);

    // Add a top-level field for easier access
    const result = listings.map((listing) => ({
      ...listing,
      ownerEmail: listing.owner?.email || null,
    }));

    return NextResponse.json(result);
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
    )
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "LANDLORD")
      return NextResponse.json(
        { error: "Only landlords can create listings." },
        { status: 400 }
      );

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price),
        area: area.trim().replace(/\s+/g, " "),
        location: location.trim().replace(/\s+/g, " "),
        phone,
        mapUrl,
        amenities,
        ownerId: user.id,
        images: { create: imageUrls.map((url: string) => ({ url })) },
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
