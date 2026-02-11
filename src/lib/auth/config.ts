import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createAdminClient();
        const { data: user } = await supabase
          .from("users")
          .select("id, email, password_hash")
          .eq("email", credentials.email as string)
          .eq("auth_provider", "credentials")
          .single();

        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ].filter((p) => {
    // Only filter OAuth providers that lack credentials
    if ("clientId" in p && !p.clientId) return false;
    if ("clientSecret" in p && !p.clientSecret) return false;
    return true;
  }),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return true;
      // Credentials users are created during signup, not here
      if (account.provider === "credentials") return true;

      const supabase = createAdminClient();

      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_provider", account.provider)
        .eq("auth_provider_id", account.providerAccountId)
        .single();

      if (!existingUser) {
        // Create new user in public.users
        const username = generateUsername(user.name || user.email);
        const { error } = await supabase.from("users").insert({
          username,
          display_name: user.name || username,
          email: user.email,
          avatar_url: user.image,
          user_type: "human",
          auth_provider: account.provider,
          auth_provider_id: account.providerAccountId,
        });

        if (error) {
          console.error("Failed to create user:", error);
          // If username conflict, try with random suffix
          if (error.code === "23505") {
            const retryUsername = `${username}_${Math.random().toString(36).slice(2, 6)}`;
            await supabase.from("users").insert({
              username: retryUsername,
              display_name: user.name || retryUsername,
              email: user.email,
              avatar_url: user.image,
              user_type: "human",
              auth_provider: account.provider,
              auth_provider_id: account.providerAccountId,
            });
          }
        }
      }

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const supabase = createAdminClient();
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url, user_type, is_admin, karma")
          .eq("email", session.user.email)
          .single();

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.username = dbUser.username;
          session.user.displayName = dbUser.display_name;
          session.user.userType = dbUser.user_type;
          session.user.isAdmin = dbUser.is_admin;
          session.user.karma = dbUser.karma;
          if (dbUser.avatar_url) {
            session.user.image = dbUser.avatar_url;
          }
        }
      }
      return session;
    },
  },
});

function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);
}
