"use client";

import { useState } from "react";

export default function ContactPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  const sw = {
    back: "← Rudi Home",
    badge: "WASILIANA NASI",
    title: "Tupo Tayari Kukusaidia",
    intro:
      "Una swali kuhusu bidhaa, order au delivery? Wasiliana na GAMORA ONLINE na timu yetu itakusaidia.",
    phone: "Simu",
    whatsapp: "WhatsApp",
    email: "Barua Pepe",
    location: "Mahali Tulipo",
    address: "Kariakoo, Dar es Salaam, Tanzania",
    hours: "Muda wa Huduma",
    hoursText: "Jumatatu – Jumamosi: 8:00 AM – 6:00 PM",
    formTitle: "Tutumie Ujumbe",
    name: "Jina lako",
    namePlaceholder: "Andika jina lako",
    emailPlaceholder: "Andika barua pepe yako",
    message: "Ujumbe",
    messagePlaceholder: "Andika ujumbe wako hapa...",
    send: "Tuma Ujumbe",
    note:
      "Kwa msaada wa haraka kuhusu order, tunapendekeza utumie WhatsApp au simu.",
    success: "Ujumbe wako umeandaliwa. Tutawasiliana nawe hivi karibuni.",
  };

  const en = {
    back: "← Back Home",
    badge: "CONTACT US",
    title: "We Are Ready to Help",
    intro:
      "Have a question about a product, order or delivery? Contact GAMORA ONLINE and our team will be happy to assist you.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    location: "Our Location",
    address: "Kariakoo, Dar es Salaam, Tanzania",
    hours: "Service Hours",
    hoursText: "Monday – Saturday: 8:00 AM – 6:00 PM",
    formTitle: "Send Us a Message",
    name: "Your Name",
    namePlaceholder: "Enter your name",
    emailPlaceholder: "Enter your email",
    message: "Message",
    messagePlaceholder: "Write your message here...",
    send: "Send Message",
    note:
      "For quick assistance with an order, we recommend using WhatsApp or calling us.",
    success: "Your message has been prepared. We will contact you soon.",
  };

  const t = language === "sw" ? sw : en;

  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

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
            📞
          </div>

          <p className="font-bold text-sky-200">
            {t.badge}
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-sky-100">
            {t.intro}
          </p>

        </div>

      </section>

      {/* CONTACT CARDS */}
      <section className="mx-auto max-w-6xl px-4 py-14">

        <div className="grid gap-6 md:grid-cols-4">

          {/* PHONE */}
          <a
            href="tel:+255798555221"
            className="rounded-2xl bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-5xl">☎️</div>

            <h2 className="mt-5 font-black">
              {t.phone}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              +255 798 555 221
            </p>
          </a>

          {/* WHATSAPP */}
          <a
            href="https://wa.me/255798555221"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-5xl">💬</div>

            <h2 className="mt-5 font-black">
              {t.whatsapp}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              +255 798 555 221
            </p>
          </a>

          {/* EMAIL */}
          <a
            href="mailto:info@gamoraonline.com"
            className="rounded-2xl bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-5xl">📧</div>

            <h2 className="mt-5 font-black">
              {t.email}
            </h2>

            <p className="mt-2 break-all text-sm text-slate-500">
              info@gamoraonline.com
            </p>
          </a>

          {/* LOCATION */}
          <div className="rounded-2xl bg-white p-7 text-center shadow-sm">

            <div className="text-5xl">📍</div>

            <h2 className="mt-5 font-black">
              {t.location}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {t.address}
            </p>

          </div>

        </div>

      </section>

      {/* CONTACT FORM */}
      <section className="bg-sky-50 px-4 py-14">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-2xl bg-white p-7 shadow-sm md:p-10">

            <div className="mb-8 text-center">

              <div className="text-5xl">
                ✉️
              </div>

              <h2 className="mt-4 text-3xl font-black">
                {t.formTitle}
              </h2>

            </div>

            {sent ? (

              <div className="rounded-xl bg-green-50 p-6 text-center text-green-700">

                <div className="text-4xl">
                  ✅
                </div>

                <p className="mt-3 font-bold">
                  {t.success}
                </p>

              </div>

            ) : (

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    {t.name}
                  </label>

                  <input
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    {t.email}
                  </label>

                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    {t.message}
                  </label>

                  <textarea
                    required
                    rows={6}
                    placeholder={t.messagePlaceholder}
                    className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-sky-700 px-6 py-4 font-black text-white transition hover:bg-sky-800"
                >
                  {t.send}
                </button>

              </form>

            )}

            <p className="mt-6 text-center text-sm leading-6 text-slate-500">
              {t.note}
            </p>

          </div>

        </div>

      </section>

      {/* SERVICE HOURS */}
      <section className="mx-auto max-w-4xl px-4 py-14">

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">
            🕐
          </div>

          <h2 className="mt-5 text-2xl font-black">
            {t.hours}
          </h2>

          <p className="mt-3 text-slate-600">
            {t.hoursText}
          </p>

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
