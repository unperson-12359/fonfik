import { Card } from "@/components/ui/card";

function PostSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex gap-3 p-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 w-5 rounded bg-muted" />
          <div className="h-4 w-4 rounded bg-muted" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Community header skeleton */}
      <Card className="animate-pulse">
        <div className="p-6 space-y-3">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="flex gap-4">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
      </Card>
      <div className="mt-4 space-y-3">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}
