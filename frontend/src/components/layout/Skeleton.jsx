export function SkeletonBlock({ width = "100%", height = "16px" }) {
  return <div className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} width={i === count - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
