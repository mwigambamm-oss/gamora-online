"use client";

import { useEffect, useState } from "react";

type Log = {
  action: string;
  time: string;
};

export default function AuditLogModule() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gamora_audit_log");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      }
    } catch {
      setLogs([]);
    }
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1E293B]">
          Audit Log
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Administrative activity history for the Business Control Center.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#E2E8F0] shadow-sm">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">📋</div>
            <p className="mt-3 font-bold">
              No activity recorded yet
            </p>
            <p className="mt-1 text-sm text-[#64748B]">
              Administrative actions will appear here when audit tracking is enabled.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log, index) => (
              <div
                key={`${log.time}-${index}`}
                className="flex flex-col justify-between gap-2 p-5 sm:flex-row"
              >
                <span className="font-semibold">{log.action}</span>
                <span className="text-sm text-[#64748B]">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
