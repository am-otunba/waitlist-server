import { prisma } from "@/lib/prisma";
import { handleOptions, jsonResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let email = searchParams.get("email");

    if (!email) {
      return jsonResponse(
        req,
        { error: "Email is required" },
        { status: 400 }
      );
    }

    email = email.toLowerCase().trim();

    const user = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (!user) {
      return jsonResponse(
        req,
        { error: "User not found" },
        { status: 404 }
      );
    }

    const position = await prisma.waitlist.count({
      where: {
        created_at: {
          lte: user.created_at,
        },
      },
    });

    return jsonResponse(req, {
      success: true,
      position,
      user,
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