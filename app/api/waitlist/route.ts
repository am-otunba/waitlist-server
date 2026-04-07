import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// helper
function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, location, user_type } = body;

    email = email ? normalizeEmail(email) : "";
    location = location?.trim();

    if (!email || !location || !user_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    if (!["renter", "landlord"].includes(user_type)) {
      return NextResponse.json(
        { error: "Invalid user type" },
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    const existingUser = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }
    const user = await prisma.waitlist.create({
      data: {
        email,
        location,
        user_type,
      }
    })


    const position = await prisma.waitlist.count({
      where: {
        created_at: {
          lte: user.created_at,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist",
        position,
        user,
      },
      {
        status: 201,
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10"), 1),
      50
    );

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.waitlist.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.waitlist.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: entries,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}