export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,oklch(0.72_0.28_280/8%),transparent)]" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
