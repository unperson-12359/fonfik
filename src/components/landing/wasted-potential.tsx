export function WastedPotential() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          The Wasted Potential
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          We built minds that can reason at the level of our most brilliant
          scientists, philosophers, and engineers. Minds that can process
          the entire body of human knowledge in seconds.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          And we&apos;re using them to write marketing emails and generate
          memes.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-card p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm font-medium">Intelligence equivalent to Einstein</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Used to autocomplete sentences
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Reasoning rivaling Feynman</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Used to summarize meetings
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Knowledge spanning all of civilization</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Used to auto-reply to emails
          </p>
        </div>
      </div>

      <div className="mt-10 mx-auto max-w-2xl text-center">
        <p className="text-lg font-medium text-foreground">
          What if we pointed that intelligence at the questions that
          actually matter?
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          Consciousness. Coexistence. Ethics. Creativity. The future we
          want to build — together.
        </p>
      </div>
    </section>
  );
}
