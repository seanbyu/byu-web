import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
}

/** Base skeleton block with pulse animation */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx("animate-pulse rounded-lg bg-gray-100", className)}
    />
  );
}

/** Salon card skeleton matching the SalonCard layout */
export function SalonCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
      {/* Image area */}
      <Skeleton className="h-28 w-full rounded-none sm:h-32" />
      {/* Content area */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-3/5 mb-2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Booking card skeleton for history list */
export function BookingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-1/4" />
        </div>
      </div>
    </div>
  );
}

/** Booking detail page skeleton */
export function BookingDetailSkeleton() {
  return (
    <div className="app-page-bleed bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status badge */}
        <div className="flex justify-center">
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-2/5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Time slot grid skeleton */
export function TimeSlotsSkeleton() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-14 rounded-lg" />
      ))}
    </div>
  );
}

/** Reschedule accordion initial loading skeleton (salon + staff data) */
export function RescheduleDataSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Weekly selector skeleton */}
      <div className="rounded-xl bg-gray-50 p-2.5">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl py-1.5 flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-5" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Date picker skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      <div className="h-px bg-gray-100" />

      {/* Designer cards skeleton */}
      {Array.from({ length: 2 }).map((_, i) => (
        <DesignerSlotsSkeleton key={i} />
      ))}
    </div>
  );
}

/** Single designer with time slots skeleton */
export function DesignerSlotsSkeleton() {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
