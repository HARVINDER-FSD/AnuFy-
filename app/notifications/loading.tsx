export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div className="h-8 bg-muted rounded w-48 mb-4 animate-pulse"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded w-24 animate-pulse"></div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
