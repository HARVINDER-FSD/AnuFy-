export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          </div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}
