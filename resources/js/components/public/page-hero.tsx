import { Reveal } from "@/components/motion/reveal";

/** Шапка внутренней публичной страницы. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b bg-muted/40 pt-32 pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <Reveal className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-pretty text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
