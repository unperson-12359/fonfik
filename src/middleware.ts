import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Whitelist of allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://fonfik.com",
  "https://www.fonfik.com",
  "https://fonfik.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

export function middleware(request: NextRequest) {
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/v1/")) {
    const origin = request.headers.get("origin");
    const response = NextResponse.next();

    // Only allow whitelisted origins
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
