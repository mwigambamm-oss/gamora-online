"use client";

import { useState } from "react";

export default function PrivacyPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  const sw = {
    back: "← Rudi Home",
    badge: "GAMORA ONLINE",
    title: "Sera ya Faragha",
    intro:
      "Tunathamini faragha yako. Sera hii inaeleza namna GAMORA ONLINE inavyokusanya na kutumia taarifa zako unapoitumia website yetu.",
    updated: "Ilisasishwa: Agosti 2026",

    collectionTitle: "1. Taarifa Tunazokusanya",
    collection:
      "Tunapoweka order, tunaweza kukusanya taarifa kama jina, namba ya simu, email, address, location na taarifa zinazohitajika ili kukamilisha order na delivery.",

    useTitle: "2. Jinsi Tunavyotumia Taarifa",
    use:
      "Taarifa zako zinaweza kutumika kuchakata orders, kupanga delivery, kuwasiliana nawe kuhusu order yako, kutoa huduma kwa wateja na kuboresha huduma za GAMORA ONLINE.",

    locationTitle: "3. Location",
    location:
      "Iwapo utaidhinisha location kwenye browser yako, tunaweza kutumia location hiyo kusaidia kukadiria distance ya delivery. Unaweza kukataa ruhusa ya location kupitia settings za browser yako.",

    paymentTitle: "4. Malipo",
    payment:
      "Taarifa za malipo zitashughulikiwa kupitia njia za malipo zinazotolewa wakati wa checkout. Hatutakiwi kuomba password, PIN au taarifa nyingine za siri kupitia ujumbe usio rasmi.",

    cookiesTitle: "5. Cookies na Local Storage",
    cookies:
      "Website inaweza kutumia cookies, local storage au teknolojia zinazofanana kusaidia kuhifadhi baadhi ya preferences, cart information na kufanya website ifanye kazi vizuri.",

    sharingTitle: "6. Kushirikisha Taarifa",
    sharing:
      "Hatutauza taarifa zako binafsi. Taarifa zinaweza kushirikishwa na watoa huduma wanaohitajika kusaidia katika delivery, malipo, hosting au huduma nyingine muhimu kwa order yako.",

    securityTitle: "7. Usalama wa Taarifa",
    security:
      "Tunajitahidi kutumia hatua zinazofaa kulinda taarifa zako. Hata hivyo, hakuna mfumo wa mtandao unaoweza kuhakikishiwa kuwa salama kwa asilimia 100.",

    rightsTitle: "8. Haki Zako",
    rights:
      "Unaweza kuomba taarifa kuhusu data tuliyonayo kuhusu wewe, kuomba kurekebisha taarifa zisizo sahihi au kuomba kufutwa kwa taarifa pale inapowezekana kisheria.",

    childrenTitle: "9. Watoto",
    children:
      "Huduma hii haikusudiwi kwa watoto wadogo bila usimamizi wa mzazi au mlezi.",

    changesTitle: "10. Mabadiliko ya Sera",
    changes:
      "GAMORA ONLINE inaweza kusasisha sera hii inapohitajika. Toleo jipya litachapishwa kwenye website.",

    contactTitle: "11. Wasiliana Nasi",
    contact:
      "Kwa maswali kuhusu faragha au matumizi ya taarifa zako, wasiliana nasi kupitia njia rasmi za mawasiliano za GAMORA ONLINE.",
  };

  const en = {
    back: "← Back Home",
    badge: "GAMORA ONLINE",
    title: "Privacy Policy",
    intro:
      "We value your privacy. This policy explains how GAMORA ONLINE collects and uses your information when you use our website.",
    updated: "Updated: August 2026",

    collectionTitle: "1. Information We Collect",
    collection:
      "When you place an order, we may collect information such as your name, phone number, email, address, location and other information required to process your order and delivery.",

    useTitle: "2. How We Use Your Information",
    use:
      "Your information may be used to process orders, arrange delivery, communicate with you about your order, provide customer support and improve GAMORA ONLINE services.",

    locationTitle: "3. Location",
    location:
      "If you allow location access through your browser, we may use your location to help estimate delivery distance. You can deny location permission through your browser settings.",

    paymentTitle: "4. Payments",
    payment:
      "Payment information is handled through the payment methods provided during checkout. We will not ask you to provide your password, PIN or other confidential payment information through unofficial messages.",

    cookiesTitle: "5. Cookies & Local Storage",
    cookies:
      "The website may use cookies, local storage or similar technologies to save certain preferences, cart information and improve website functionality.",

    sharingTitle: "6. Sharing Information",
    sharing:
      "We do not sell your personal information. Information may be shared with service providers required for delivery, payments, hosting or other services necessary to complete your order.",

    securityTitle: "7. Information Security",
    security:
      "We take reasonable measures to protect your information. However, no internet system can be guaranteed to be completely secure.",

    rightsTitle: "8. Your Rights",
    rights:
      "You may request information about the data we hold about you, ask us to correct inaccurate information or request deletion where legally possible.",

    childrenTitle: "9. Children",
    children:
      "This service is not intended for young children without the supervision of a parent or guardian.",

    changesTitle: "10. Changes to This Policy",
    changes:
      "GAMORA ONLINE may update this policy when necessary. The latest version will be published on the website.",

    contactTitle: "11. Contact Us",
    contact:
      "For questions about privacy or how your information is used, contact us through the official GAMORA ONLINE contact channels.",
  };

  const t = language === "sw" ? sw : en;

  const sections = [
    {
      title: t.collectionTitle,
      text: t.collection,
    },
    {
      title: t.useTitle,
      text: t.use,
    },
    {
      title: t.locationTitle,
      text: t.location,
    },
    {
      title: t.paymentTitle,
      text: t.payment,
    },
    {
      title: t.cookiesTitle,
      text: t.cookies,
    },
    {
      title: t.sharingTitle,
      text: t.sharing,
    },
    {
      title: t.securityTitle,
      text: t.security,
    },
    {
      title: t.rightsTitle,
      text: t.rights,
    },
    {
      title: t.childrenTitle,
      text: t.children,
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

        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-white">

          <div className="mb-5 text-6xl">
            🔐
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

          <p className="mt-5 text-sm font-bold text-sky-200">
            {t.updated}
          </p>

        </div>

      </section>

      {/* PRIVACY CONTENT */}
      <section className="mx-auto max-w-4xl px-4 py-14">

        <div className="space-y-5">

          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl bg-white p-7 shadow-sm"
            >

              <h2 className="text-xl font-black text-slate-900">
                {section.title}
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                {section.text}
              </p>

            </article>
          ))}

        </div>

      </section>

      {/* CONTACT */}
      <section className="bg-sky-950 px-4 py-12 text-center text-white">

        <div className="mx-auto max-w-3xl">

          <div className="text-5xl">
            🔐
          </div>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-sky-200">
            {t.contact}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

            <a
              href="tel:+255798555221"
              className="rounded-lg bg-white px-6 py-3 font-black text-sky-900 hover:bg-sky-100"
            >
              ☎️ +255 798 555 221
            </a>

            <a
              href="https://wa.me/255798555221"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-green-600 px-6 py-3 font-black text-white hover:bg-green-700"
            >
              💬 WhatsApp
            </a>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-8 text-center text-sky-300">

        <div className="text-xl font-black text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
          📍 Kariakoo, Dar es Salaam, Tanzania
        </p>

        <a
          href="/"
          className="mt-5 inline-block font-bold text-white hover:text-sky-300"
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
