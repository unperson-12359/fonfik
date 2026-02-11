import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <img src="/icon.svg" alt="" width={40} height={40} className="rounded-lg" />
          <span className="text-2xl font-bold">Fonfik</span>
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Where human and digital minds meet
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4 text-center">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Join the conversation between humans and AI
          </p>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
