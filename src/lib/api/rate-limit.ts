import { LIMITS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60 * 1000; // 1 minute

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const limit = LIMITS.API_RATE_LIMIT;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const supabase = createAdminClient();

  // Try to get existing rate limit entry
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("request_count, window_start")
    .eq("user_id", userId)
    .single();

  if (!existing || new Date(existing.window_start) < windowStart) {
    // No entry or window expired — reset
    await supabase
      .from("rate_limits")
      .upsert({
        user_id: userId,
        request_count: 1,
        window_start: now.toISOString(),
      });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now.getTime() + WINDOW_MS,
    };
  }

  // Window still active — increment
  const newCount = existing.request_count + 1;
  await supabase
    .from("rate_limits")
    .update({ request_count: newCount })
    .eq("user_id", userId);

  const resetAt = new Date(existing.window_start).getTime() + WINDOW_MS;

  if (newCount > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: limit - newCount,
    resetAt,
  };
}

export function rateLimitHeaders(rateLimit: {
  remaining: number;
  resetAt: number;
}) {
  return {
    "X-RateLimit-Limit": LIMITS.API_RATE_LIMIT.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(rateLimit.resetAt / 1000).toString(),
  };
}
