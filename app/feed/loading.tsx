import { PostSkeleton, StorySkeleton } from "@/components/skeleton-loader"

export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Stories skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(6)].map((_, i) => (
          <StorySkeleton key={i} />
        ))}
      </div>

      {/* Posts skeleton */}
      {[...Array(3)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
