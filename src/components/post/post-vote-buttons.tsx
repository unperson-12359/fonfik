"use client";

import { vote } from "@/actions/votes";
import { VoteButtons } from "@/components/vote/vote-buttons";
import type { VoteValue } from "@/types";

interface PostVoteButtonsProps {
  postId: string;
  score: number;
  userVote?: VoteValue | null;
}

export function PostVoteButtons({
  postId,
  score,
  userVote,
}: PostVoteButtonsProps) {
  return (
    <VoteButtons
      score={score}
      userVote={userVote}
      onVote={async (value) => {
        await vote({ postId, value });
      }}
    />
  );
}
