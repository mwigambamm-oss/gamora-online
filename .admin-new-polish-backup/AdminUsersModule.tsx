"use client";

export default function AdminUsersModule() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1E293B]">
          Admin Users
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage access to the GAMORA Business Control Center.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#E2E8F0] shadow-sm">
        <div className="border-b p-6">
          <h3 className="font-black">Administrator Account</h3>
          <p className="mt-1 text-sm text-slate-500">
            Current authenticated administrator
          </p>
        </div>

        <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-xl font-black text-[#172554]">
              G
            </div>

            <div>
              <p className="font-black">Administrator</p>
              <p className="text-sm text-slate-500">
                Super Admin
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-[#1E3A8A]">
            Active
          </span>
        </div>

        <div className="border-t bg-[#F8FAF9] p-6">
          <a
            href="/recover-admin-password"
            className="inline-flex rounded-xl bg-[#172554] px-5 py-3 text-sm font-bold text-white hover:bg-[#1E3A8A]"
          >
            🔐 Change Password
          </a>
        </div>
      </div>
    </section>
  );
}
