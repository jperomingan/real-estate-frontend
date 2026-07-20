interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-2 text-slate-600">
        {description}
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <p className="text-sm text-slate-500">
            The {title.toLowerCase()} module will be implemented next.
          </p>
        </div>
      </section>
    </div>
  );
}
