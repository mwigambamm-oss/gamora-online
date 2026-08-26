"use client";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-5">
          <a href="/" className="text-xl font-black">
            GAMORA <span className="text-[#E30613]">ONLINE</span>
          </a>

          <a
            href="/"
            className="text-sm font-bold text-[#E30613] hover:underline"
          >
            ← Rudi Dukani
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[900px] px-4 py-10">
        <p className="text-xs font-black uppercase tracking-widest text-[#E30613]">
          AKAUNTI
        </p>

        <h1 className="mt-2 text-2xl font-black">
          Taarifa Zangu
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Angalia taarifa za akaunti yako na bidhaa/oda zako.
        </p>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Taarifa za Akaunti</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Jina</p>
              <p className="mt-1 font-bold">Taarifa zako</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Email</p>
              <p className="mt-1 font-bold">Email yako</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Simu</p>
              <p className="mt-1 font-bold">Namba yako ya simu</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Anwani</p>
              <p className="mt-1 font-bold">Anwani yako</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Bidhaa / Oda Zangu</h2>

          <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
            Bidhaa na oda zako zitaonekana hapa.
          </div>
        </div>
      </section>
    </main>
  );
}
