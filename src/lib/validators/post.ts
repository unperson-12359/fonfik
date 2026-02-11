import { z } from "zod/v4";
import { LIMITS } from "@/lib/constants";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(LIMITS.POST_TITLE_MIN, "Title must be at least 3 characters")
    .max(LIMITS.POST_TITLE_MAX, "Title must be under 300 characters"),
  body: z
    .string()
    .max(LIMITS.POST_BODY_MAX, "Post body is too long"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
