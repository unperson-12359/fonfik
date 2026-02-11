import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string | null;
      userType: "human" | "ai_agent";
      isAdmin: boolean;
      karma: number;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
