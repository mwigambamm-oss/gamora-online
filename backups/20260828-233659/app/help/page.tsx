"use client";

import { useState } from "react";

type Language = "sw" | "en";

type FAQ = {
  question: string;
  answer: string;
};

const faqSw: FAQ[] = [
  {
    question: "Ninawezaje ku-order bidhaa?",
    answer:
      "Chagua bidhaa unayoipenda, bonyeza 'Weka kwenye Cart', fungua Cart yako, kisha bonyeza 'Proceed to Checkout'. Jaza taarifa zako, weka location yako na kamilisha oda.",
  },
  {
    question: "Je, nahitaji WhatsApp kuweka order?",
    answer:
      "Hapana. Unaweza kuweka order moja kwa moja kupitia website. WhatsApp ni njia ya ziada ya mawasiliano na si lazima uwe nayo ili ku-order.",
  },
  {
    question: "Delivery inahesabiwaje?",
    answer:
      "Delivery inaanzia Kariakoo, Dar es Salaam. Mfumo unaweza kutumia location yako kupima umbali na kuhesabu delivery fee kulingana na distance.",
  },
  {
    question: "Ninawezaje kujua delivery fee yangu?",
    answer:
      "Wakati wa Checkout, bonyeza 'Tumia Location Yangu'. Mfumo utapima distance kutoka Kariakoo na kukuonyesha delivery fee kabla ya kukamilisha order.",
  },
  {
    question: "Naweza kubadilisha au kufuta order?",
    answer:
      "Ndiyo, lakini unatakiwa kuwasiliana na GAMORA ONLINE haraka iwezekanavyo kabla order haijaanza kusafirishwa.",
  },
  {
    question: "Bidhaa ikifika ikiwa imeharibika nifanye nini?",
    answer:
      "Wasiliana na Customer Support mara moja na toa maelezo ya tatizo pamoja na picha za bidhaa ikiwa inahitajika. Tutakusaidia kulingana na return policy ya bidhaa.",
  },
  {
    question: "Ninawezaje kuwasiliana na GAMORA ONLINE?",
    answer:
      "Unaweza kutupigia simu au kutuma WhatsApp kupitia +255 798 555 221.",
  },
  {
    question: "GAMORA ONLINE ipo wapi?",
    answer:
      "GAMORA ONLINE inapatikana Kariakoo, Dar es Salaam, Tanzania.",
  },
];

const faqEn: FAQ[] = [
  {
    question: "How can I place an order?",
    answer:
      "Choose the product you want, click 'Add to Cart', open your Cart and click 'Proceed to Checkout'. Enter your details, share your location and complete your order.",
  },
  {
    question: "Do I need WhatsApp to place an order?",
    answer:
      "No. You can place an order directly through our website. WhatsApp is only an additional communication option.",
  },
  {
    question: "How is delivery calculated?",
    answer:
      "Delivery starts from Kariakoo, Dar es Salaam. The system can use your location to calculate the distance and determine the delivery fee.",
  },
  {
    question: "How can I know my delivery fee?",
    answer:
      "During Checkout, click 'Use My Location'. The system will calculate the distance from Kariakoo and show your delivery fee before you complete the order.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "Yes, but please contact GAMORA ONLINE as soon as possible before your order has been dispatched.",
  },
  {
    question: "What if my product arrives damaged?",
    answer:
      "Contact Customer Support immediately and provide details of the issue. Photos may be requested depending on the situation and product return policy.",
  },
  {
    question: "How can I contact GAMORA ONLINE?",
    answer:
      "You can call or WhatsApp us through +255 798 555 221.",
  },
  {
    question: "Where is GAMORA ONLINE located?",
    answer:
      "GAMORA ONLINE is located in Kariakoo, Dar es Salaam, Tanzania.",
  },
];

export default function HelpCenterPage() {
  const [language, setLanguage] =
    useState<Language>("sw");

  const [openIndex, setOpenIndex] =
    useState<number | null>(null);

  const faqs =
    language === "sw" ? faqSw : faqEn;

  const text = {
    sw: {
      back: "← Rudi Home",
      badge: "GAMORA ONLINE SUPPORT",
      title: "Kituo cha Msaada",
      subtitle:
        "Pata majibu ya maswali ya kawaida kuhusu ununuzi, oda na delivery.",
      faqTitle: "Maswali Yanayoulizwa Mara kwa Mara",
      contactTitle: "Bado unahitaji msaada?",
      contactText:
        "Timu yetu iko tayari kukusaidia kuhusu order, bidhaa au delivery.",
      call: "Piga Simu",
      whatsapp: "WhatsApp",
      guide: "Mwongozo wa Ununuzi",
      about: "Kuhusu GAMORA ONLINE",
      address: "Kariakoo, Dar es Salaam, Tanzania",
    },

    en: {
      back: "← Back Home",
      badge: "GAMORA ONLINE SUPPORT",
      title: "Help Center",
      subtitle:
        "Find answers to common questions about shopping, orders and delivery.",
      faqTitle: "Frequently Asked Questions",
      contactTitle: "Still need help?",
      contactText:
        "Our team is ready to help you with your order, products or delivery.",
      call: "Call Us",
      whatsapp: "WhatsApp",
      guide: "Shopping Guide",
      about: "About GAMORA ONLINE",
      address: "Kariakoo, Dar es Salaam, Tanzania",
    },
  };

  const t = text[language];

  return (
    <main className="min-h-screen bg-slate-50">

      {/* TOP BAR */}

      <div className="bg-sky-950 px-4 py-2 text-center text-sm text-white">
        🌊 GAMORA ONLINE • Customer Support
      </div>

      {/* HEADER */}

      <header className="border-b bg-white shadow-sm">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">

          <a
            href="/"
            className="text-2xl font-black text-sky-700"
          >
            GAMORA
            <span className="text-sky-950">
              ONLINE
            </span>
          </a>

          <div className="flex items-center gap-3">

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

          <div className="mb-5 text-5xl">
            💬
          </div>

          <p className="font-bold text-sky-200">
            {t.badge}
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-sky-100">
            {t.subtitle}
          </p>

        </div>

      </section>

      {/* FAQ */}

      <section className="mx-auto max-w-4xl px-4 py-14">

        <div className="mb-8">

          <p className="font-bold text-sky-600">
            GAMORA ONLINE
          </p>

          <h2 className="mt-1 text-3xl font-black">
            {t.faqTitle}
          </h2>

        </div>

        <div className="space-y-4">

          {faqs.map((faq, index) => {

            const isOpen =
              openIndex === index;

            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >

                <button
                  onClick={() =>
                    setOpenIndex(
                      isOpen ? null : index
                    )
                  }
                  className="flex w-full items-center justify-between gap-5 p-5 text-left font-black transition hover:bg-sky-50"
                >

                  <span>
                    {faq.question}
                  </span>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition ${
                      isOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    ↓
                  </span>

                </button>

                {isOpen && (

                  <div className="border-t bg-slate-50 px-5 py-5 leading-7 text-slate-600">
                    {faq.answer}
                  </div>

                )}

              </div>
            );
          })}

        </div>

      </section>

      {/* CONTACT SUPPORT */}

      <section className="bg-sky-50 px-4 py-14">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm md:p-12">

            <div className="text-5xl">
              🎧
            </div>

            <h2 className="mt-5 text-3xl font-black">
              {t.contactTitle}
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
              {t.contactText}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <a
                href="tel:+255798555221"
                className="rounded-lg bg-sky-700 px-7 py-4 font-black text-white transition hover:bg-sky-800"
              >
                ☎️ {t.call}
              </a>

              <a
                href="https://wa.me/255798555221"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-green-600 px-7 py-4 font-black text-white transition hover:bg-green-700"
              >
                💬 {t.whatsapp}
              </a>

            </div>

            <div className="mt-7 text-sm text-slate-500">
              📍 {t.address}
              <br />
              ☎️ +255 798 555 221
            </div>

          </div>

        </div>

      </section>

      {/* QUICK LINKS */}

      <section className="mx-auto max-w-5xl px-4 py-14">

        <div className="grid gap-5 md:grid-cols-3">

          <a
            href="/"
            className="rounded-xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">
              🛍️
            </div>

            <h3 className="mt-4 font-black">
              {t.guide}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Shop and discover products.
            </p>
          </a>

          <a
            href="/"
            className="rounded-xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">
              🌊
            </div>

            <h3 className="mt-4 font-black">
              {t.about}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              GAMORA ONLINE
            </p>
          </a>

          <a
            href="/cart"
            className="rounded-xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">
              🛒
            </div>

            <h3 className="mt-4 font-black">
              Shopping Cart
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Review your products.
            </p>
          </a>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-sky-950 px-4 py-10 text-center text-sky-200">

        <div className="text-xl font-black text-white">
          GAMORA
          <span className="text-sky-300">
            ONLINE
          </span>
        </div>

        <p className="mt-3 text-sm">
          📍 Kariakoo, Dar es Salaam, Tanzania
        </p>

        <p className="mt-1 text-sm">
          ☎️ +255 798 555 221
        </p>

        <div className="mt-6">

          <a
            href="/"
            className="font-bold text-white hover:text-sky-300"
          >
            {t.back}
          </a>

        </div>

        <div className="mt-8 border-t border-sky-800 pt-6 text-xs">
          © {new Date().getFullYear()} GAMORA ONLINE.
          All rights reserved.
        </div>

      </footer>

    </main>
  );
}
