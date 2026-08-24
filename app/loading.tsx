"use client";

import { GraduationCap, Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Soft Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="z-10 flex flex-col items-center space-y-4 text-center">
        {/* Pulsing Brand Container */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-indigo-600/20 blur-xl animate-pulse" />
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-200 relative z-10">
            <GraduationCap className="w-9 h-9 animate-bounce" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base tracking-tight">AI Writing Assessment & Practice</h3>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading workspace...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
