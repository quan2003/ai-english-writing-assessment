"use client";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-slate-200 rounded-xl" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-9 w-9 bg-indigo-50 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-300 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content Skeleton Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-6 w-16 bg-slate-300 rounded-lg" />
              <div className="h-2 w-full bg-slate-200 rounded-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
