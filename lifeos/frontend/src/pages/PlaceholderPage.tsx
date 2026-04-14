type PlaceholderPageProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="rounded-[2rem] border border-line/80 bg-card/95 p-8 shadow-glow">
        <p className="font-accent text-2xl text-terracotta">In progress</p>
        <h1 className="mt-2 font-serif text-5xl italic text-ink">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/75">{subtitle}</p>
      </div>
    </section>
  );
}
