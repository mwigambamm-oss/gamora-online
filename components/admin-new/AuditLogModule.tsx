"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Values = Record<string, unknown> | null;

type Log = {
  id: number;
  admin_user_id: string | null;
  admin_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Values;
  new_values: Values;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(date);
}

function formatValue(value: unknown): string {
  if (value === undefined) return "Not recorded";
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getChangedFields(log: Log) {
  const oldValues = log.old_values ?? {};
  const newValues = log.new_values ?? {};
  const keys = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
  );

  return keys
    .filter((key) => !sameValue(oldValues[key], newValues[key]))
    .map((key) => ({
      key,
      oldValue: oldValues[key],
      newValue: newValues[key],
      hasOld: Object.prototype.hasOwnProperty.call(oldValues, key),
      hasNew: Object.prototype.hasOwnProperty.call(newValues, key),
    }));
}


function getRecordName(log: Log): string {
  const candidates = [log.new_values, log.old_values];
  const nameKeys = [
    "name",
    "product_name",
    "productName",
    "title",
    "category_name",
    "categoryName",
    "display_name",
  ];

  for (const values of candidates) {
    if (!values) continue;

    for (const key of nameKeys) {
      const value = values[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  const isProduct =
    log.table_name?.toLowerCase() === "products" ||
    log.action.toUpperCase().startsWith("PRODUCT_");

  if (isProduct) return `Product ${log.record_id || log.id}`;
  if (log.table_name?.toLowerCase() === "categories") {
    return `Category ${log.record_id || log.id}`;
  }

  return log.record_id || `Record ${log.id}`;
}

function isProductLog(log: Log): boolean {
  return (
    log.table_name?.toLowerCase() === "products" ||
    log.action.toUpperCase().startsWith("PRODUCT_")
  );
}

function JsonPanel({
  title,
  values,
}: {
  title: string;
  values: Values;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3 font-bold text-slate-800">
        {title}
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-5 text-slate-700">
        {values ? JSON.stringify(values, null, 2) : "No data recorded"}
      </pre>
    </div>
  );
}

export default function AuditLogModule() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin-new/audit-logs", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load audit history.");
      }

      setLogs(Array.isArray(result.logs) ? result.logs : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load audit history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!selectedLog) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedLog(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLog]);

  const changedFields = selectedLog ? getChangedFields(selectedLog) : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1E293B]">Audit Log</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Administrative activity history for the Business Control Center.
            Select any record to inspect its full details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-bold">Could not load audit history</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading audit history...
          </div>
        ) : !error && logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-bold text-slate-800">No activity recorded yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Recorded administrative activities will appear here.
            </p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Activity</th>
                  <th className="px-5 py-4">Administrator</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Product / Item</th>
                  <th className="px-5 py-4">Record ID</th>
                  <th className="px-5 py-4">Date and time</th>
                  <th className="px-5 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedLog(log);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open audit details for ${log.action}, record ${log.record_id || log.id}`}
                    className="cursor-pointer align-top transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-600"
                  >
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800">{log.action}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{log.admin_name || "Administrator"}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {log.admin_user_id || "No user ID"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {log.table_name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      {isProductLog(log) && log.record_id ? (
                        <a
                          href={`/admin-new?section=Products&productId=${encodeURIComponent(log.record_id)}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950"
                          title="Find this product in Admin Products"
                        >
                          {getRecordName(log)}
                        </a>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {getRecordName(log)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {log.record_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Showing up to 200 most recent records. Access is restricted to the
        authorized Gamora administrator.
      </p>

      {selectedLog && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLog(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Audit record #{selectedLog.id}
                </p>
                <h3
                  id="audit-detail-title"
                  className="mt-1 break-words text-xl font-black text-slate-900"
                >
                  {selectedLog.action}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(selectedLog.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close audit details"
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </header>

            <div className="space-y-7 p-5 sm:p-7">
              <div>
                <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                  Activity information
                </h4>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Administrator", selectedLog.admin_name || "Administrator"],
                    ["Admin user ID", selectedLog.admin_user_id || "Not recorded"],
                    ["Action", selectedLog.action],
                    ["Table", selectedLog.table_name || "Not recorded"],
                    ["Record ID", selectedLog.record_id || "Not recorded"],
                    ["Date and time", formatDate(selectedLog.created_at)],
                    ["IP address", selectedLog.ip_address || "Not recorded"],
                    ["User agent", selectedLog.user_agent || "Not recorded"],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-xl border border-slate-200 p-3">
                      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">
                    Field-by-field changes
                  </h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {changedFields.length} changed {changedFields.length === 1 ? "field" : "fields"}
                  </span>
                </div>

                {changedFields.length > 0 ? (
                  <div className="space-y-3">
                    {changedFields.map((field) => (
                      <div
                        key={field.key}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
                          {fieldLabel(field.key)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                          <div className="min-w-0 border-b border-slate-200 p-4 sm:border-b-0 sm:border-r">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
                              Previous value
                            </p>
                            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                              {field.hasOld ? formatValue(field.oldValue) : "Field did not exist"}
                            </pre>
                          </div>
                          <div className="min-w-0 bg-emerald-50/50 p-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                              New value
                            </p>
                            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                              {field.hasNew ? formatValue(field.newValue) : "Field removed"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No field-by-field comparison is available for this record.
                    The full recorded data is shown below when available.
                  </p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                  Complete recorded data
                </h4>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <JsonPanel title="Old values — complete" values={selectedLog.old_values} />
                  <JsonPanel title="New values — complete" values={selectedLog.new_values} />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Close details
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
