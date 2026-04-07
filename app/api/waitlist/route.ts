import { prisma } from "@/lib/prisma";
import { handleOptions, jsonResponse } from "@/lib/cors";

// helper
function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, location, user_type } = body;

    email = email ? normalizeEmail(email) : "";
    location = location?.trim();

    if (!email || !location || !user_type) {
      return jsonResponse(
        req,
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["renter", "landlord"].includes(user_type)) {
      return jsonResponse(
        req,
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existingUser) {
      return jsonResponse(
        req,
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const user = await prisma.waitlist.create({
      data: {
        email,
        location,
        user_type,
      },
    });

    const position = await prisma.waitlist.count({
      where: {
        created_at: {
          lte: user.created_at,
        },
      },
    });

    return jsonResponse(
      req,
      {
        success: true,
        message: "Successfully joined the waitlist",
        position,
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return jsonResponse(
      req,
      { error: "Server error" },
      { status: 500 }
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

    return jsonResponse(req, {
      success: true,
      data: entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      req,
      { error: "Server error" },
      { status: 500 }
    );
  }
}