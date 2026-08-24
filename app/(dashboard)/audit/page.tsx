"use client";

import { useEffect, useState } from "react";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Audit Stream</h2>
          <p className="text-xs text-slate-500 mt-1">Immutable audit logging for score approvals, changes, and organization events</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Event Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-bold text-slate-900">{log.user?.fullName || "System Admin"}</td>
                <td className="p-4">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-medium">{log.entityType} ({log.entityId.slice(0, 8)})</td>
                <td className="p-4 text-[11px] text-slate-500 font-mono line-clamp-1">{log.newValue || log.oldValue || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
