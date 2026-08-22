"use client";

import { useState } from "react";

export default function AboutPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  const sw = {
    back: "← Rudi Home",
    badge: "KUHUSU GAMORA ONLINE",
    title: "Tunafanya Ununuzi Uwe Rahisi",
    intro:
      "GAMORA ONLINE ni duka la mtandaoni linalokuwezesha kugundua na kuagiza bidhaa mbalimbali kwa urahisi, ukiwa popote Dar es Salaam.",
    missionTitle: "Dhamira Yetu",
    mission:
      "Kutoa uzoefu rahisi, salama na wa kuaminika wa ununuzi mtandaoni, huku tukiwafikishia wateja bidhaa zao kwa urahisi.",
    visionTitle: "Maono Yetu",
    vision:
      "Kuwa moja ya majukwaa yanayoaminika ya ununuzi mtandaoni Tanzania, tukitumia teknolojia kufanya biashara iwe rahisi zaidi.",
    whyTitle: "Kwa Nini GAMORA ONLINE?",
    quality: "Bidhaa Zilizochaguliwa",
    qualityText:
      "Tunajitahidi kuhakikisha bidhaa zinazopatikana kwenye GAMORA ONLINE zinakidhi viwango vizuri.",
    delivery: "Delivery Rahisi",
    deliveryText:
      "Tunapanga delivery kulingana na location na distance ya mteja.",
    support: "Huduma kwa Wateja",
    supportText:
      "Timu yetu ipo tayari kusaidia kuhusu bidhaa, order na delivery.",
    location: "Mahali Tulipo",
    address: "Kariakoo, Dar es Salaam, Tanzania",
    phone: "Simu",
  };

  const en = {
    back: "← Back Home",
    badge: "ABOUT GAMORA ONLINE",
    title: "Making Online Shopping Easier",
    intro:
      "GAMORA ONLINE is an online shopping platform that allows you to discover and order different products conveniently from anywhere in Dar es Salaam.",
    missionTitle: "Our Mission",
    mission:
      "To provide a simple, secure and reliable online shopping experience while making product delivery convenient for our customers.",
    visionTitle: "Our Vision",
    vision:
      "To become one of the trusted online shopping platforms in Tanzania by using technology to make business and shopping easier.",
    whyTitle: "Why GAMORA ONLINE?",
    quality: "Selected Products",
    qualityText:
      "We aim to provide products that offer good value and quality to our customers.",
    delivery: "Easy Delivery",
    deliveryText:
      "We plan delivery based on the customer's location and distance.",
    support: "Customer Support",
    supportText:
      "Our team is ready to assist with products, orders and delivery.",
    location: "Our Location",
    address: "Kariakoo, Dar es Salaam, Tanzania",
    phone: "Phone",
  };

  const t = language === "sw" ? sw : en;

  return (
    <main className="min-h-screen bg-slate-50">

      {/* TOP BAR */}
      <div className="bg-sky-950 px-4 py-2 text-center text-sm text-white">
        🌊 GAMORA ONLINE • Kariakoo, Dar es Salaam
      </div>

      {/* HEADER */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">

          <a
            href="/"
            className="text-2xl font-black text-sky-700"
          >
            GAMORA
            <span className="text-sky-950">ONLINE</span>
          </a>

          <div className="flex gap-2">

            <button
              onClick={() => setLanguage("sw")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                language === "sw"
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              🇹🇿 SW
            </button>

            <button
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                language === "en"
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              🇬🇧 EN
            </button>

          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-950 via-sky-800 to-cyan-600">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-white">

          <div className="mb-5 text-6xl">
            🌊
          </div>

          <p className="font-bold text-sky-200">
            {t.badge}
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-sky-100">
            {t.intro}
          </p>

        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="mx-auto max-w-5xl px-4 py-14">

        <div className="grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="text-4xl">🎯</div>

            <h2 className="mt-5 text-2xl font-black">
              {t.missionTitle}
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {t.mission}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="text-4xl">🚀</div>

            <h2 className="mt-5 text-2xl font-black">
              {t.visionTitle}
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {t.vision}
            </p>
          </div>

        </div>

      </section>

      {/* WHY GAMORA */}
      <section className="bg-sky-50 px-4 py-14">

        <div className="mx-auto max-w-5xl">

          <div className="text-center">
            <p className="font-bold text-sky-600">
              GAMORA ONLINE
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {t.whyTitle}
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
              <div className="text-5xl">🛍️</div>

              <h3 className="mt-5 text-xl font-black">
                {t.quality}
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                {t.qualityText}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
              <div className="text-5xl">📦</div>

              <h3 className="mt-5 text-xl font-black">
                {t.delivery}
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                {t.deliveryText}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
              <div className="text-5xl">💬</div>

              <h3 className="mt-5 text-xl font-black">
                {t.support}
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                {t.supportText}
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* CONTACT INFORMATION */}
      <section className="mx-auto max-w-5xl px-4 py-14">

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm md:p-12">

          <div className="text-5xl">📍</div>

          <h2 className="mt-5 text-2xl font-black">
            {t.location}
          </h2>

          <p className="mt-3 text-slate-600">
            {t.address}
          </p>

          <p className="mt-2 text-slate-600">
            ☎️ {t.phone}: +255 798 555 221
          </p>

          <div className="mt-7">

            <a
              href="https://wa.me/255798555221"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg bg-green-600 px-7 py-4 font-black text-white hover:bg-green-700"
            >
              💬 WhatsApp GAMORA ONLINE
            </a>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-10 text-center text-sky-200">

        <div className="text-xl font-black text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
          📍 {t.address}
        </p>

        <p className="mt-1 text-sm">
          ☎️ +255 798 555 221
        </p>

        <a
          href="/"
          className="mt-6 inline-block font-bold text-white hover:text-sky-300"
        >
          {t.back}
        </a>

        <div className="mt-8 border-t border-sky-800 pt-6 text-xs">
          © {new Date().getFullYear()} GAMORA ONLINE. All rights reserved.
        </div>

      </footer>

    </main>
  );
}

