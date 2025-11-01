import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// CREATE booking
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      listingId,
      firstname,
      lastname,
      email,
      price,
      userId,
      startDate,
      endDate,
      eventType,
    } = body;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        listingId,
        firstname,
        lastname,
        email,
        price,
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        eventType,
        status: "PENDING",
      },
    });

    // Mark listing as unavailable
    await prisma.listing.update({
      where: { id: listingId },
      data: { isAvailable: false },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// UPDATE availability manually
export async function PUT(req: Request) {
  try {
    const { listingId, isAvailable } = await req.json();

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { isAvailable },
    });

    return NextResponse.json({ success: true, listing });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
