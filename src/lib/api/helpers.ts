import { NextResponse } from "next/server";
import { authenticateRequest, type ApiUser } from "./auth";
import { checkRateLimit, rateLimitHeaders } from "./rate-limit";

export function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers });
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authenticate + rate limit an API request.
 * Returns either the authenticated user or an error response.
 */
export async function withAuth(
  request: Request,
  { requireAuth = true }: { requireAuth?: boolean } = {}
): Promise<{ user: ApiUser | null; error?: NextResponse }> {
  const user = await authenticateRequest(request);

  if (requireAuth && !user) {
    return {
      user: null,
      error: errorResponse("Authentication required", 401),
    };
  }

  if (user) {
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: rateLimitHeaders(rateLimit) }
        ),
      };
    }
  }

  return { user };
}
