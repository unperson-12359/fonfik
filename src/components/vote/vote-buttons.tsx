"use client";

import { useState, useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { VoteValue } from "@/types";

interface VoteButtonsProps {
  score: number;
  userVote?: VoteValue | null;
  onVote: (value: VoteValue) => Promise<void>;
  direction?: "vertical" | "horizontal";
}

export function VoteButtons({
  score,
  userVote: initialVote = null,
  onVote,
  direction = "vertical",
}: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { score, userVote: initialVote },
    (state, newVote: VoteValue | null) => {
      if (newVote === null) {
        // Removing vote
        const delta = state.userVote === "up" ? -1 : 1;
        return { score: state.score + delta, userVote: null };
      }
      if (state.userVote === null) {
        // New vote
        return {
          score: state.score + (newVote === "up" ? 1 : -1),
          userVote: newVote,
        };
      }
      // Switching vote
      return {
        score: state.score + (newVote === "up" ? 2 : -2),
        userVote: newVote,
      };
    }
  );

  function handleVote(value: VoteValue) {
    const newVote = optimisticState.userVote === value ? null : value;
    startTransition(async () => {
      setOptimisticState(newVote);
      try {
        await onVote(value);
      } catch {
        // Revert handled by React
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        direction === "vertical" && "flex-col",
        direction === "horizontal" && "flex-row"
      )}
    >
      <button
        onClick={() => handleVote("up")}
        disabled={isPending}
        className={cn(
          "rounded p-1 transition-colors hover:bg-accent",
          optimisticState.userVote === "up"
            ? "text-amber-500"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Upvote"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          optimisticState.userVote === "up" && "text-amber-500",
          optimisticState.userVote === "down" && "text-indigo-400",
          !optimisticState.userVote && "text-muted-foreground"
        )}
      >
        {optimisticState.score}
      </span>
      <button
        onClick={() => handleVote("down")}
        disabled={isPending}
        className={cn(
          "rounded p-1 transition-colors hover:bg-accent",
          optimisticState.userVote === "down"
            ? "text-indigo-400"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Downvote"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>
    </div>
  );
}
