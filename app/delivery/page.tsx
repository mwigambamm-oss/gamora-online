"use client";

import { useEffect } from "react";

import { useState } from "react";
import { FaTruck, FaMapMarkerAlt, FaRoute, FaShoppingCart } from "react-icons/fa";

export default function DeliveryPage() {
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
    badge: "Uwasilishaji Rahisi na Salama",
    title: "Uwasilishaji Rahisi na Salama",
    intro:
      "Tunakuletea bidhaa zako kutoka Kariakoo, Dar es Salaam hadi ulipo.",
    startingPoint: "Kituo cha Uwasilishaji",
    startingPointText:
      "Uwasilishaji wa GAMORA ONLINE unaanzia Kariakoo, Dar es Salaam.",
    distance: "Uwasilishaji kwa Umbali",
    distanceText:
      "Gharama ya delivery inaweza kuhesabiwa kulingana na umbali kutoka Kariakoo hadi eneo lako.",
    location: "Tumia Eneo Lako",
    locationText:
      "Wakati wa kukamilisha oda utaweza kuruhusu tovuti kutumia eneo lako ili kusaidia kukadiria umbali wa uwasilishaji.",
    areas: "Maeneo Tunayohudumia",
    areasText:
      "Tunaanza na Dar es Salaam na maeneo yanayozunguka. Upatikanaji inaweza kutegemea eneo na umbali.",
    process: "Jinsi Uwasilishaji Unavyofanya Kazi",
    step1: "Chagua bidhaa",
    step1Text: "Ongeza bidhaa unazotaka kwenye Kikapu.",
    step2: "Weka taarifa zako",
    step2Text: "Jaza jina, simu na address/eneo lako.",
    step3: "Pima distance",
    step3Text:
      "Mfumo utatumia eneo lako kusaidia kuhesabu distance kutoka Kariakoo.",
    step4: "Thibitisha Oda",
    step4Text:
      "Kagua bidhaa, delivery fee na jumla kabla ya kuthibitisha oda.",
    noteTitle: "Muhimu",
    note:
      "Gharama ya uwasilishaji itaonyeshwa kabla ya order kukamilishwa. Gharama inaweza kutofautiana kulingana na umbali na eneo la delivery.",
    support: "Unahitaji msaada?",
    whatsapp: "Wasiliana nasi WhatsApp",
  };

  const en = {
    back: "← Back Home",
    badge: "Uwasilishaji Rahisi na Salama",
    title: "Easy and Reliable Delivery",
    intro:
      "We deliver your products from Kariakoo, Dar es Salaam to your location.",
    startingPoint: "Delivery Starting Point",
    startingPointText:
      "GAMORA ONLINE delivery starts from Kariakoo, Dar es Salaam.",
    distance: "Uwasilishaji kwa Umbali",
    distanceText:
      "Uwezo wa gharama ya uwasilishaji unaweza kuhesabiwa kulingana na umbali kutoka Kariakoo hadi eneo lako.",
    location: "Tumia Eneo Lako",
    locationText:
      "Wakati wa kukamilisha oda, utaweza kuruhusu tovuti kutumia eneo lako kusaidia kukadiria umbali wa uwasilishaji.",
    areas: "Areas We Serve",
    areasText:
      "We are starting with Dar es Salaam and surrounding areas. Upatikanaji may depend on location and distance.",
    process: "Jinsi Uwasilishaji Unavyofanya Kazi",
    step1: "Choose your products",
    step1Text: "Ongeza bidhaa unazotaka kwenye kikapu chako.",
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

        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-white">

          <div className="mb-5 text-6xl">
            
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

        </div>

      </section>

      {/* DELIVERY FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-14">

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">

            <div className="flex justify-center">
              <FaShoppingCart className="text-4xl text-green-600" />
              <FaRoute className="text-4xl text-sky-700" />
              <FaMapMarkerAlt className="text-4xl text-red-600" />
              <FaTruck className="text-4xl text-sky-700" />
              
            </div>

            <h2 className="mt-5 text-base font-medium">
              {t.startingPoint}
            </h2>

            <p className="mt-3 leading-6 text-slate-500">
              {t.startingPointText}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">

            <div className="flex justify-center">
              📏
            </div>

            <h2 className="mt-5 text-base font-medium">
              {t.distance}
            </h2>

            <p className="mt-3 leading-6 text-slate-500">
              {t.distanceText}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">

            <div className="flex justify-center">
              🛰️
            </div>

            <h2 className="mt-5 text-base font-medium">
              {t.location}
            </h2>

            <p className="mt-3 leading-6 text-slate-500">
              {t.locationText}
            </p>

          </div>

        </div>

      </section>

      {/* PROCESS */}
      <section className="bg-sky-50 px-4 py-14">

        <div className="mx-auto max-w-5xl">

          <div className="text-center">

            <p className="font-normal text-sky-600">
              GAMORA ONLINE
            </p>

            <h2 className="mt-2 text-xl font-medium">
              {t.process}
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-base font-medium text-white">
                1
              </div>

              <h3 className="mt-5 font-medium">
                {t.step1}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step1Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-base font-medium text-white">
                2
              </div>

              <h3 className="mt-5 font-medium">
                {t.step2}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step2Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-base font-medium text-white">
                3
              </div>

              <h3 className="mt-5 font-medium">
                {t.step3}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.step3Text}
              </p>

            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-base font-medium text-white">
                4
              </div>

              <h3 className="mt-5 font-medium">
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

        <div className="rounded-2xl border border-sky-100 bg-white p-4 text-center shadow-sm">

          <div className="flex justify-center">
            ℹ️
          </div>

          <h2 className="mt-5 text-lg font-medium">
            {t.noteTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-6 text-slate-600">
            {t.note}
          </p>

        </div>

      </section>

      {/* SUPPORT */}
      <section className="bg-sky-950 px-4 py-14 text-center text-white">

        <div className="mx-auto max-w-3xl">

          <div className="flex justify-center">
            💬
          </div>

          <h2 className="mt-5 text-xl font-medium">
            {t.support}
          </h2>

          <a
            href="https://wa.me/255798555221"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block rounded-lg bg-green-600 px-7 py-4 font-medium hover:bg-green-700"
          >
            {t.whatsapp}
          </a>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-5 text-center text-sky-200">

        <div className="text-base font-medium text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
           Kariakoo, Dar es Salaam, Tanzania
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
