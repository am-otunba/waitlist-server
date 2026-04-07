import { NextResponse } from "next/server";

const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getCorsHeaders(origin?: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleOptions(req: Request) {
  const origin = req.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export function jsonResponse(
  req: Request,
  body: unknown,
  init?: ResponseInit
) {
  const origin = req.headers.get("origin");

  return NextResponse.json(body, {
    ...init,
    headers: {
      ...getCorsHeaders(origin),
      ...(init?.headers || {}),
    },
  });
}