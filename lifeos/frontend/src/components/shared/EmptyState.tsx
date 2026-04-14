type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-line bg-card/70 p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-parchment" />
      <h3 className="mt-4 font-serif text-3xl italic text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink/70">{description}</p>
    </div>
  );
}
