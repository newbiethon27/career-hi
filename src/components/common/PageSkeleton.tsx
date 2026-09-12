export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl animate-pulse space-y-4 px-4 py-10">
      <div className="h-8 w-1/3 rounded bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="h-6 w-2/3 rounded bg-muted" />
      <div className="h-6 w-1/2 rounded bg-muted" />
    </div>
  );
}
