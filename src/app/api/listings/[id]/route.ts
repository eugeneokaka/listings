import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

// ✅ GET a single listing with images, owner, comments & replies
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: true,
        owner: {
          select: { firstname: true, lastname: true, image: true, email: true },
        },
        comments: {
          where: { parentId: null }, // top-level comments only
          include: {
            author: {
              select: { firstname: true, lastname: true, image: true },
            },
            replies: {
              include: {
                author: {
                  select: { firstname: true, lastname: true, image: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // increment views
    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// ✅ POST a comment or reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, parentId } = body;

    if (!content)
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const comment = await prisma.comment.create({
      data: {
        content,
        listingId: id,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { firstname: true, lastname: true, image: true },
        },
        replies: {
          include: {
            author: {
              select: { firstname: true, lastname: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing)
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (existing.ownerId !== user?.id)
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await req.json();
    const {
      title,
      description,
      price,
      area,
      location,
      category,
      phone,
      isAvailable,
      newImages,
      deletedImages,
    } = body;

    // Delete removed images
    if (deletedImages?.length) {
      await prisma.image.deleteMany({
        where: { id: { in: deletedImages } },
      });
    }

    // Add new images
    if (newImages?.length) {
      await prisma.image.createMany({
        data: newImages.map((url: string) => ({
          url,
          listingId: id,
        })),
      });
    }

    // Update listing fields
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: parseFloat(price),
        area,
        location,
        category,
        phone,
        isAvailable,
      },
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}
