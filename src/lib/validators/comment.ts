import { z } from "zod/v4";
import { LIMITS } from "@/lib/constants";

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(LIMITS.COMMENT_BODY_MIN, "Comment cannot be empty")
    .max(LIMITS.COMMENT_BODY_MAX, "Comment is too long"),
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
