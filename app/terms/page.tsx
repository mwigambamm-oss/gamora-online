"use client";

import { useEffect } from "react";

import { useState } from "react";

export default function TermsPage() {
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
    badge: "GAMORA ONLINE",
    title: "Masharti na Vigezo",
    intro:
      "Kwa kutumia GAMORA ONLINE, unakubaliana na vigezo na masharti haya. Tafadhali yasome kabla ya kuweka oda.",
    updated: "Ilisasishwa: Agosti 2026",

    accountTitle: "1. Taarifa za Mteja",
    account:
      "Mteja anatakiwa kutoa taarifa sahihi wakati wa kuweka order, ikiwemo jina, namba ya simu, anwani na taarifa nyingine zinazohitajika kwa delivery.",

    ordersTitle: "2. Orders",
    orders:
      "Oda inayowekwa kupitia tovuti inaweza kukaguliwa kabla ya kuthibitishwa. GAMORA ONLINE inaweza kuwasiliana na mteja kuthibitisha order ikiwa taarifa zaidi zinahitajika.",

    priceTitle: "3. Bei za Bidhaa",
    price:
      "Bei zinazoonyeshwa kwenye tovuti zinaweza kubadilika. Bei itakayoonyeshwa wakati wa kuthibitisha oda ndiyo itatumika, isipokuwa pale ambapo kuna hitilafu ya wazi ya mfumo au bei.",

    paymentTitle: "4. Malipo",
    payment:
      "Njia za malipo zitakazoonekana wakati wa malipo ndizo zitakazotumika. Mteja anatakiwa kuhakikisha taarifa za malipo ni sahihi na salama.",

    deliveryTitle: "5. Delivery",
    delivery:
      "Uwasilishaji unaweza kuhesabiwa kulingana na umbali na eneo la mteja. Muda wa delivery unaweza kutofautiana kulingana na eneo, msongamano wa magari, hali ya hewa na sababu nyingine za usafirishaji.",

    productsTitle: "6. Bidhaa",
    products:
      "Tunajitahidi kuhakikisha taarifa za bidhaa, picha, bei na upatikanaji wa bidhaa ni sahihi. Hata hivyo, kunaweza kutokea tofauti ndogo kwenye picha au maelezo ya bidhaa.",

    cancellationTitle: "7. Mabadiliko ya Oda na Matumizi ya Huduma",
    cancellation:
      "Maombi ya cancellation au marejesho yatashughulikiwa kulingana na hali ya order na sera ya bidhaa husika. Mteja anatakiwa kuwasiliana na GAMORA ONLINE mapema iwezekanavyo.",

    conductTitle: "8. Matumizi ya Website",
    conduct:
      "Mteja hatakiwi kutumia tovuti kwa shughuli haramu, udanganyifu, kuharibu mfumo au kujaribu kupata taarifa ambazo hana ruhusa nazo.",

    changesTitle: "9. Mabadiliko ya Masharti",
    changes:
      "GAMORA ONLINE inaweza kubadilisha masharti haya inapohitajika. Toleo jipya litachapishwa kwenye tovuti.",

    contactTitle: "10. Mawasiliano",
    contact:
      "Kwa maswali kuhusu masharti haya, wasiliana nasi kupitia simu, WhatsApp au njia nyingine rasmi za mawasiliano zilizowekwa kwenye tovuti.",
  };

  const en = {
    back: "← Back Home",
    badge: "GAMORA ONLINE",
    title: "Terms & Conditions",
    intro:
      "By using GAMORA ONLINE, you agree to these terms and conditions. Please read them before placing an order.",
    updated: "Updated: August 2026",

    accountTitle: "1. Customer Information",
    account:
      "Customers are required to provide accurate information when placing an order, including their name, phone number, address and other information required for delivery.",

    ordersTitle: "2. Orders",
    orders:
      "Orders placed through the tovuti may be reviewed before confirmation. GAMORA ONLINE may contact the customer if additional information is required.",

    priceTitle: "3. Product Prices",
    price:
      "Prices displayed on the tovuti may change. The price shown at the time of order confirmation will normally apply, except in cases of obvious system or pricing errors.",

    paymentTitle: "4. Payments",
    payment:
      "Payment methods displayed during malipo are the available methods for the order. Customers are responsible for ensuring that payment information is accurate and secure.",

    deliveryTitle: "5. Delivery",
    delivery:
      "Delivery charges may be calculated based on the customer's umbali and location. Delivery times may vary depending on location, msongamano wa magari, weather and other transportation factors.",

    productsTitle: "6. Products",
    products:
      "We aim to keep product information, images, prices and upatikanaji wa bidhaa levels accurate. However, minor differences may occur between product images and actual products.",

    cancellationTitle: "7. Order Changes and Service Usage",
    cancellation:
      "Cancellation or marejesho requests will be handled according to the order status and the applicable product policy. Customers should contact GAMORA ONLINE as soon as possible.",

    conductTitle: "8. Website Use",
    conduct:
      "Customers must not use the tovuti for illegal activities, fraud, damaging the system or attempting to access information without authorization.",

    changesTitle: "9. Changes to These Terms",
    changes:
      "GAMORA ONLINE may update these terms when necessary. The latest version will be published on the tovuti.",

    contactTitle: "10. Contact",
    contact:
      "For questions regarding these terms, contact us through phone, WhatsApp or other official contact channels provided on the tovuti.",
  };

  const t = language === "sw" ? sw : en;

  const sections = [
    {
      title: t.accountTitle,
      text: t.account,
    },
    {
      title: t.ordersTitle,
      text: t.orders,
    },
    {
      title: t.priceTitle,
      text: t.price,
    },
    {
      title: t.paymentTitle,
      text: t.payment,
    },
    {
      title: t.deliveryTitle,
      text: t.delivery,
    },
    {
      title: t.productsTitle,
      text: t.products,
    },
    {
      title: t.cancellationTitle,
      text: t.cancellation,
    },
    {
      title: t.conductTitle,
      text: t.conduct,
    },
    {
      title: t.changesTitle,
      text: t.changes,
    },
    {
      title: t.contactTitle,
      text: t.contact,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">

      {/* TOP BAR */}
      <div className="bg-sky-950 px-4 py-2 text-center text-sm text-white">
        GAMORA ONLINE • Kariakoo, Dar es Salaam
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

        <div className="mx-auto max-w-4xl px-4 py-8 text-center text-white">

          <div className="mb-5 text-6xl">
            📄
          </div>

          <p className="font-normal text-sky-200">
            {t.badge}
          </p>

          <h1 className="mt-3 text-4xl font-medium md:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-sky-100">
            {t.intro}
          </p>

          <p className="mt-5 text-xs font-normal text-sky-200">
            {t.updated}
          </p>

        </div>

      </section>

      {/* TERMS */}
      <section className="mx-auto max-w-4xl px-4 py-14">

        <div className="space-y-5">

          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl bg-white p-7 shadow-sm"
            >

              <h2 className="text-base font-medium text-slate-900">
                {section.title}
              </h2>

              <p className="mt-4 leading-6 text-slate-600">
                {section.text}
              </p>

            </article>
          ))}

        </div>

      </section>

      {/* CONTACT */}
      <section className="bg-sky-950 px-4 py-6 text-center text-white">

        <div className="mx-auto max-w-3xl">

          <div className="text-5xl">
            💬
          </div>

          <p className="mx-auto mt-4 max-w-xl leading-6 text-sky-200">
            {t.contact}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

            <a
              href="tel:+255798555221"
              className="rounded-lg bg-white px-6 py-3 font-medium text-sky-900 hover:bg-sky-100"
            >
              ☎️ +255 798 555 221
            </a>

            <a
              href="https://wa.me/255798555221"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
            >
              💬 WhatsApp
            </a>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-8 text-center text-sky-300">

        <div className="text-base font-medium text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
          📍 Kariakoo, Dar es Salaam, Tanzania
        </p>

        <a
          href="/"
          className="mt-5 inline-block font-normal text-white hover:text-sky-300"
        >
          {t.back}
        </a>

        <div className="mt-6 border-t border-sky-800 pt-5 text-xs">
          © {new Date().getFullYear()} GAMORA ONLINE. All rights reserved.
        </div>

      </footer>

    </main>
  );
}
