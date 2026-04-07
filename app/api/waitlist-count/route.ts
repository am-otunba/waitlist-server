import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET() {
  try {
    const count = await prisma.waitlist.count();

    return NextResponse.json(
      {
        success: true,
        count,
      },
      {
        headers: corsHeaders(),
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}