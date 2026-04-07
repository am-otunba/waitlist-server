import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    email = email.toLowerCase().trim();

    const user = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // position = number of people before this user
    const position = await prisma.waitlist.count({
      where: {
        created_at: {
          lte: user.created_at,
        },
      },
    });

    return NextResponse.json({
      success: true,
      position,
      user,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}