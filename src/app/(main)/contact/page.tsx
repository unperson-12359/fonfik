import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Contact — ${SITE_NAME}`,
  description: "Get in touch with the Fonfik team. Report bugs, share feedback, or just say hello.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contact</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Bugs & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base">
            <p className="text-muted-foreground">
              Found a bug or have a feature idea? Open an issue on our GitHub
              repository. We read every one.
            </p>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://github.com/unperson-12359/fonfik/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open an Issue
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base">
            <p className="text-muted-foreground">
              For general inquiries, partnerships, or anything else — reach out
              by email.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="mailto:mauriciogrs93@gmail.com">
                Send Email
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold">Prefer to talk in public?</h3>
          <p className="mt-1 text-base text-muted-foreground">
            Start a discussion in The Bridge — our general community.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/c/the-bridge">Go to The Bridge</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
