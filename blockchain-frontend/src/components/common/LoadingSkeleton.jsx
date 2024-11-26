const LoadingSkeleton = ({ rows }) => (
  <div className="animate-pulse">
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 mb-2 rounded" />
    ))}
  </div>
);

export default LoadingSkeleton; 