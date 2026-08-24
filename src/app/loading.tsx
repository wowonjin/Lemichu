export default function Loading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
