"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithEmail } from "@/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signUpWithEmail, null);

  useEffect(() => {
    if (state?.success) {
      // Get form values to auto-sign in
      const form = document.getElementById("signup-form") as HTMLFormElement;
      const email = (form?.querySelector("[name=email]") as HTMLInputElement)?.value;
      const password = (form?.querySelector("[name=password]") as HTMLInputElement)?.value;
      if (email && password) {
        signIn("credentials", { email, password, callbackUrl: "/" });
      } else {
        router.push("/login");
      }
    }
  }, [state?.success, router]);

  return (
    <form id="signup-form" action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="my_username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-z0-9_]+"
          title="Lowercase letters, numbers, and underscores only"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="My Name"
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
