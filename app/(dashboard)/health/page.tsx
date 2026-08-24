"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Health & Telemetry</h2>
          <p className="text-xs text-slate-500 mt-1">Realtime database state, queue telemetry, and AI service health</p>
        </div>
      </div>

      {health && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Database Connection</span>
              <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {health.database}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Model Snapshot</span>
              <div className="text-lg font-bold text-indigo-700 font-mono">
                {health.aiService?.model || "gpt-4o-2024-11-20"}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Async Job Queue</span>
              <div className="text-sm font-semibold text-slate-700 space-x-3">
                <span>Queued: <b>{health.jobs?.queued}</b></span>
                <span>Processing: <b>{health.jobs?.processing}</b></span>
                <span>Failed: <b>{health.jobs?.failed}</b></span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Average Grading Latency</span>
                <span className="text-2xl font-extrabold text-slate-900">{health.performance?.avgLatencyMs} ms</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block">Total Grading Executions</span>
                <span className="text-2xl font-extrabold text-slate-900">{health.performance?.totalGradingRequests}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
