import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clerkId, email, firstName, lastName, role } = body;

    // 🔍 Validate required fields
    if (!clerkId || !email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🧠 Convert role string to uppercase to match ENUM (USER / LANDLORD)
    const roleEnum = role.toUpperCase() === "LANDLORD" ? "LANDLORD" : "USER";

    // ✅ Create user in database
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstname: firstName,
        lastname: lastName,
        role: roleEnum,
        verified: true, // or false if you plan to verify manually
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: unknown) {
    console.error("❌ Error saving profile:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
