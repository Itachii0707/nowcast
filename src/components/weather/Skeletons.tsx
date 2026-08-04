/**
 * Neubrutalist loading skeletons: solid ink-bordered blocks, no soft shimmer.
 */

function Block({ className = "" }: { className?: string }) {
  return <div className={`brut-flat animate-pulse bg-muted ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]" aria-hidden="true">
      <Block className="h-72" />
      <Block className="h-72" />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:col-span-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Block key={index} className="h-28" />
        ))}
      </div>
      <Block className="h-40 lg:col-span-2" />
      <Block className="h-72" />
      <Block className="h-72" />
    </div>
  );
}

export function InlineSkeleton() {
  return <Block className="h-6 w-24" />;
}
