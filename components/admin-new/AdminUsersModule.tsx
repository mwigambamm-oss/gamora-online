"use client";

export default function AdminUsersModule() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#3F3437]">
          Admin Users
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage access to the GAMORA Business Control Center.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8DEE1] bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="font-black">Administrator Account</h3>
          <p className="mt-1 text-sm text-slate-500">
            Current authenticated administrator
          </p>
        </div>

        <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EDEF] text-xl font-black text-[#800020]">
              G
            </div>

            <div>
              <p className="font-black">Administrator</p>
              <p className="text-sm text-slate-500">
                Super Admin
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            Active
          </span>
        </div>

        <div className="border-t bg-slate-50 p-6">
          <a
            href="/admin/change-password"
            className="inline-flex rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:bg-[#6b001b]"
          >
            🔐 Change Password
          </a>
        </div>
      </div>
    </section>
  );
}
