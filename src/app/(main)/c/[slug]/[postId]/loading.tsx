import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Post skeleton */}
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-6 w-6 rounded bg-muted" />
              <div className="h-4 w-6 rounded bg-muted" />
              <div className="h-6 w-6 rounded bg-muted" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse border-l-2 border-border/50 pl-3 py-2">
          <div className="flex gap-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
          </div>
          <div className="mt-2 h-4 w-full rounded bg-muted" />
          <div className="mt-1 h-4 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
