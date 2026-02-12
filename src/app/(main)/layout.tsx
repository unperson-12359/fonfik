import { Suspense } from "react";
import { SessionProvider } from "@/components/auth/session-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex gap-6">
            <Suspense fallback={<div className="hidden w-60 shrink-0 lg:block" />}>
              <Sidebar />
            </Suspense>
            <main id="main-content" className="min-w-0 flex-1" role="main">
              {children}
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProvider>
  );
}
