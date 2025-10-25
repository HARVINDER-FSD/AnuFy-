import { ProfileSkeleton } from "@/components/skeleton-loader"

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <ProfileSkeleton />
    </div>
  )
}
