"use client";

import { useState } from "react";

export default function DeliveryPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  const sw = {
    back: "← Rudi Home",
    badge: "GAMORA ONLINE DELIVERY",
    title: "Delivery Rahisi na Salama",
    intro:
      "Tunakuletea bidhaa zako kutoka Kariakoo, Dar es Salaam hadi ulipo.",
    startingPoint: "Kituo cha Delivery",
    startingPointText:
      "Delivery ya GAMORA ONLINE inaanzia Kariakoo, Dar es Salaam.",
    distance: "Delivery kwa Distance",
    distanceText:
      "Gharama ya delivery inaweza kuhesabiwa kulingana na umbali kutoka Kariakoo hadi location yako.",
    location: "Tumia Location Yako",
    locationText:
      "Wakati wa Checkout utaweza kuruhusu website kutumia location yako ili kusaidia kukadiria distance ya delivery.",
    areas: "Maeneo Tunayohudumia",
    areasText:
      "Tunaanza na Dar es Salaam na maeneo yanayozunguka. Availability inaweza kutegemea eneo na umbali.",
    process: "Jinsi Delivery Inavyofanya Kazi",
    step1: "Chagua bidhaa",
    step1Text: "Ongeza bidhaa unazotaka kwenye Cart.",
    step2: "Weka taarifa zako",
    step2Text: "Jaza jina, simu na address/location yako.",
    step3: "Pima distance",
    step3Text:
      "Mfumo utatumia location yako kusaidia kuhesabu distance kutoka Kariakoo.",
    step4: "Thibitisha Order",
    step4Text:
      "Kagua bidhaa, delivery fee na jumla kabla ya kuweka order.",
    noteTitle: "Muhimu",
    note:
      "Delivery fee itaonyeshwa kabla ya order kukamilishwa. Gharama inaweza kutofautiana kulingana na distance na eneo la delivery.",
    support: "Unahitaji msaada?",
    whatsapp: "Wasiliana nasi WhatsApp",
  };

  const en = {
    back: "← Back Home",
    badge: "GAMORA ONLINE DELIVERY",
    title: "Easy and Reliable Delivery",
    intro:
      "We deliver your products from Kariakoo, Dar es Salaam to your location.",
    startingPoint: "Delivery Starting Point",
    startingPointText:
      "GAMORA ONLINE delivery starts from Kariakoo, Dar es Salaam.",
    distance: "Distance-Based Delivery",
    distanceText:
      "Delivery charges can be calculated based on the distance from Kariakoo to your location.",
    location: "Use Your Location",
    locationText:
      "During Checkout, you will be able to allow the website to use your location to help estimate delivery distance.",
    areas: "Areas We Serve",
    areasText:
      "We are starting with Dar es Salaam and surrounding areas. Availability may depend on location and distance.",
    process: "How Delivery Works",
    step1: "Choose your products",
    step1Text: "Add the products you want to your Cart.",
    step2: "Enter your details",
    step2Text: "Provide your name, phone number and address/location.",
    step3: "Calculate distance",
    step3Text:
      "The system will use your location to help calculate the distance from Kariakoo.",
    step4: "Confirm your order",
    step4Text:
      "Review your products, delivery fee and total before placing your order.",
    noteTitle: "Important",
    note:
      "The delivery fee will be displayed before the order is completed. The charge may vary depending on distance and delivery area.",
    support: "Need help?",
    whatsapp: "Contact us on WhatsApp",
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
            🚚
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

      {/* DELIVERY FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-14">

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="text-5xl">
              📍
            </div>

            <h2 className="mt-5 text-xl font-black">
              {t.startingPoint}
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              {t.startingPointText}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="text-5xl">
              📏
            </div>

            <h2 className="mt-5 text-xl font-black">
              {t.distance}
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              {t.distanceText}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="text-5xl">
              🛰️
            </div>

            <h2 className="mt-5 text-xl font-black">
              {t.location}
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              {t.locationText}
            </p>

          </div>

        </div>

      </section>

      {/* PROCESS */}
      <section className="bg-sky-50 px-4 py-14">

        <div className="mx-auto max-w-5xl">

          <div className="text-center">

            <p className="font-bold text-sky-600">
              GAMORA ONLINE
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {t.process}
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-xl font-black text-white">
                1
              </div>

              <h3 className="mt-5 font-black">
                {t.step1}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step1Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-xl font-black text-white">
                2
              </div>

              <h3 className="mt-5 font-black">
                {t.step2}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step2Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-xl font-black text-white">
                3
              </div>

              <h3 className="mt-5 font-black">
                {t.step3}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step3Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-xl font-black text-white">
                4
              </div>

              <h3 className="mt-5 font-black">
                {t.step4}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step4Text}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* IMPORTANT NOTE */}
      <section className="mx-auto max-w-4xl px-4 py-14">

        <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">
            ℹ️
          </div>

          <h2 className="mt-5 text-2xl font-black">
            {t.noteTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            {t.note}
          </p>

        </div>

      </section>

      {/* SUPPORT */}
      <section className="bg-sky-950 px-4 py-14 text-center text-white">

        <div className="mx-auto max-w-3xl">

          <div className="text-5xl">
            💬
          </div>

          <h2 className="mt-5 text-3xl font-black">
            {t.support}
          </h2>

          <a
            href="https://wa.me/255798555221"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block rounded-lg bg-green-600 px-7 py-4 font-black hover:bg-green-700"
          >
            {t.whatsapp}
          </a>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-10 text-center text-sky-200">

        <div className="text-xl font-black text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
          📍 Kariakoo, Dar es Salaam, Tanzania
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
