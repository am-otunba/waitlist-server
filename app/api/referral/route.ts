import { prisma } from "@/lib/prisma";
import { handleOptions, jsonResponse } from "@/lib/cors";

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, referral_code } = body;

    email = email?.toLowerCase().trim();

    if (!email || !referral_code) {
      return jsonResponse(
        req,
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const referrer = await prisma.waitlist.findUnique({
      where: { referral_code },
    });

    if (!referrer) {
      return jsonResponse(
        req,
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    await prisma.waitlist.update({
      where: { id: referrer.id },
      data: {
        created_at: new Date(Date.now() - 1000),
      },
    });

    return jsonResponse(req, {
      success: true,
      message: "Referral applied",
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