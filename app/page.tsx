import FlyerStudio from "../components/FlyerStudio";
import HeroFlyer from "../components/HeroFlyer";
import { config } from "../lib/config";

const steps = [
  { n: "1", t: "Upload your photo", d: "Choose a clear picture of yourself. Zoom and drag to frame it perfectly." },
  { n: "2", t: "Add your name & address", d: "Type them in and watch the official flyer update instantly." },
  { n: "3", t: "Download & share", d: "Save your flyer and post it on WhatsApp, Facebook, LinkedIn or X." },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="" width={36} height={36} className="size-9 rounded-lg" />
      <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide text-ink">
        {config.brandName}
      </span>
    </span>
  );
}

export default function Home() {
  const { hero } = config;
  const [before, after] = hero.title.split(hero.accent);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" aria-label={`${config.brandFull} home`}>
            <Logo />
          </a>
          <a
            href="#studio"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary-dark px-5 text-sm font-semibold text-white transition hover:bg-primary-dark/90"
          >
            Create flyer
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-dark">
                {config.eventLine}
              </p>
              <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {before}
                <span className="text-primary">{hero.accent}</span>
                {after}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/75">{hero.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#studio"
                  className="inline-flex min-h-12 items-center rounded-xl bg-primary-dark px-8 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark/90"
                >
                  Generate flyer
                </a>
                <span className="text-sm font-medium text-ink/65">{hero.trust}</span>
              </div>
            </div>
            <HeroFlyer />
          </div>
        </section>

        <FlyerStudio />

        <section className="bg-white px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">How it works</h2>
            <ol className="mt-10 grid gap-5 sm:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-3xl bg-cream p-7 ring-1 ring-black/5">
                  <span className="grid size-11 place-items-center rounded-full bg-primary-dark font-display text-xl font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
            <svg viewBox="0 0 24 24" className="size-9 text-primary-dark" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
              <path d="M9 12l2.2 2.2L15.5 10" />
            </svg>
            <h2 className="text-xl font-semibold">Your photo never leaves your device</h2>
            <p className="text-ink/70">
              Your flyer is created right here in your browser and your photo is never uploaded. Only your name and address are saved when you download.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-ink/65">
            © {new Date().getFullYear()} {config.brandFull}. {config.campaign} · Timeless Christ: Transforming Campus and Culture.
          </p>
        </div>
      </footer>
    </>
  );
}
