"use client";

import { useEffect } from "react";

import { useState } from "react";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

export default function ContactPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("gamora_language");

    if (
      savedLanguage === "sw" ||
      savedLanguage === "en"
    ) {
      setLanguage(savedLanguage);
    }
  }, []);

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
    hoursText: "Jumatatu – Ijumaa: 24 Hours | Jumamosi: Kuanzia saa 12:00 Jioni | Jumapili: 24 Hours",
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
    hoursText: "Monday – Friday: 24 Hours | Saturday: From 12:00 PM | Sunday: 24 Hours",
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        message: data.get("message"),
      }),
    });

    if (response.ok) {
      setSent(true);
      form.reset();
    }
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
            className="text-lg font-medium text-sky-700"
          >
            GAMORA
            <span className="text-sky-950">ONLINE</span>
          </a>

          <div className="flex gap-2">

            <button
              onClick={() => setLanguage("sw")}
              className={`rounded-lg px-3 py-2 text-xs font-normal ${
                language === "sw"
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              🇹🇿 SW
            </button>

            <button
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-3 py-2 text-xs font-normal ${
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

        <div className="mx-auto max-w-5xl px-4 py-5 text-center text-white">

          <div className="mb-5 text-6xl">
            📞
          </div>

          <p className="font-normal text-sky-200">
            {t.badge}
          </p>

          <h1 className="mt-3 text-lg font-medium md:text-lg">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-sky-100">
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
            className="rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <FaPhoneAlt className="mx-auto text-lg text-sky-700" />

            <h2 className="mt-3 text-sm font-medium">
              {t.phone}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              +255 798 555 221<br/>+255 676 285 283
            </p>
          </a>

          {/* WHATSAPP */}
          <a
            href="https://wa.me/255798555221"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <FaWhatsapp className="mx-auto text-4xl text-green-600" />

            <h2 className="mt-3 text-sm font-medium">
              {t.whatsapp}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              +255 798 555 221
            </p>
          </a>

          {/* EMAIL */}
          <a
            href="mailto:officialgamoraonline@gmail.com"
            className="rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <FaEnvelope className="mx-auto text-lg text-sky-700" />

            <h2 className="mt-3 text-sm font-medium">
              {t.email}
            </h2>

            <p className="mt-2 break-all text-sm text-slate-500">
              officialgamoraonline@gmail.com
            </p>
          </a>

          {/* LOCATION */}
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">

            <FaMapMarkerAlt className="mx-auto text-4xl text-red-600" />

            <h2 className="mt-3 text-sm font-medium">
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

          <div className="rounded-xl bg-white p-4 shadow-sm md:p-5">

            <div className="mb-8 text-center">

              <div className="text-5xl">
                ✉️
              </div>

              <h2 className="mt-4 text-xl font-medium">
                {t.formTitle}
              </h2>

            </div>

            {sent ? (

              <div className="rounded-xl bg-green-50 p-6 text-center text-green-700">

                <div className="text-4xl">
                  ✅
                </div>

                <p className="mt-3 font-normal">
                  {t.success}
                </p>

              </div>

            ) : (

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-xs font-normal">
                    {t.name}
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs font-normal">
                    {t.email}
                  </label>

                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={t.emailPlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs font-normal">
                    {t.message}
                  </label>

                  <textarea
                    required
                    rows={6}
                    name="message"
                    placeholder={t.messagePlaceholder}
                    className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-sky-700 px-6 py-4 font-medium text-white transition hover:bg-sky-800"
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

        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">

          <div className="text-5xl">
            🕐
          </div>

          <h2 className="mt-5 text-lg font-medium">
            {t.hours}
          </h2>

          <p className="mt-3 text-slate-600">
            {t.hoursText}
          </p>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-5 text-center text-sky-200">

        <div className="text-base font-medium text-white">
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
          className="mt-6 inline-block font-normal text-white hover:text-sky-300"
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
