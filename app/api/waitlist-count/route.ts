import { prisma } from "@/lib/prisma";
import { handleOptions, jsonResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

export async function GET(req: Request) {
  try {
    const count = await prisma.waitlist.count();

    return jsonResponse(req, {
      success: true,
      count,
    });
  } catch (error) {
    console.error("WAITLIST COUNT ERROR:", error);

    return jsonResponse(
      req,
      { error: "Server error" },
      { status: 500 }
    );
  }
}