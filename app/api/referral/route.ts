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

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, referral_code } = body;

    email = email?.toLowerCase().trim();

    if (!email || !referral_code) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const referrer = await prisma.waitlist.findUnique({
      where: { referral_code },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    // reward = move referrer up (by updating timestamp)
    await prisma.waitlist.update({
      where: { id: referrer.id },
      data: {
        created_at: new Date(Date.now() - 1000), // slight boost
      },
    });

    return NextResponse.json({
      success: true,
      message: "Referral applied",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}