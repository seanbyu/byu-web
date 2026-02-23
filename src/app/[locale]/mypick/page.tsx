"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/features/auth";
import { MyPickView } from "@/features/mypick";

export default function MyPickPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="app-page-bleed bg-white">
        {/* Header Skeleton */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="h-7 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
        {/* Tabs Skeleton */}
        <div className="flex border-b border-gray-100">
          <div className="flex-1 py-3 flex justify-center">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex-1 py-3 flex justify-center">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MyPickView />;
}
