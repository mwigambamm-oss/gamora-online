import { EN_SW_DICTIONARY } from "./dictionary";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const EN_SW_PHRASES: Record<string, string> = {
  "Its compact size is particularly convenient for occasions where carrying a large handbag is unnecessary.": "Ukubwa wake mdogo ni rahisi hasa katika matukio ambayo si lazima kubeba mkoba mkubwa wa mkononi.",

  "This Women's Mini Crossbody Fashion Bag is a compact and stylish everyday accessory designed for women who prefer a lightweight bag for carrying their most important personal items.":
    "Mkoba huu Mdogo wa Wanawake wa Kubebea Begani ni kifaa kidogo na cha kisasa cha matumizi ya kila siku, kilichoundwa kwa ajili ya wanawake wanaopendelea mkoba mwepesi wa kubeba vitu vyao muhimu vya kibinafsi.",

  "Its small and modern design makes it easy to carry while shopping, going for casual outings, meeting friends, attending events or enjoying a short trip around town.":
    "Muundo wake mdogo na wa kisasa hurahisisha kubeba wakati wa kufanya ununuzi, matembezi ya kawaida, kukutana na marafiki, kuhudhuria matukio au kufanya safari fupi mjini.",

  "The bag provides enough space for essential items such as a smartphone, wallet, bank cards, keys, lipstick and other small accessories.":
    "Mkoba huu una nafasi ya kutosha kwa vitu muhimu kama simu janja, pochi, kadi za benki, funguo, lipstick na vifaa vingine vidogo vya ziada.",

  "Its adjustable shoulder strap allows the bag to be worn comfortably across the body or over one shoulder, providing hands-free convenience while moving around.":
    "Kamba yake ya begani inayorekebishika huwezesha mkoba kuvaliwa kwa raha mwilini kwa kuvuka begani au begani upande mmoja, na kukupa urahisi wa kutembea bila kuushika mkoba.",

  "The clean and fashionable design makes this mini bag easy to match with casual dresses, jeans, skirts, tops and other everyday outfits.":
    "Muundo wake safi na wa kuvutia huufanya mkoba huu mdogo uwe rahisi kuendana na magauni ya kawaida, jeans, sketi, tops na mavazi mengine ya kila siku.",


  "Material":
    "Nyenzo",

  "Bag Type":
    "Aina ya Mkoba",

  "Size":
    "Ukubwa",

  "Closure":
    "Kifungio",

  "Strap":
    "Kamba",

  "Interior":
    "Ndani",

  "Pockets":
    "Mifuko",

  "Design":
    "Muundo",

  "Weight":
    "Uzito",

  "Carrying Style":
    "Mtindo wa Kubeba",

  "Suitable For":
    "Inafaa kwa",

  "Gender":
    "Jinsia",

  "Available Colours":
    "Rangi Zinazopatikana",

  "smartphone":
    "simu janja",

  "wallet":
    "pochi",

  "keys":
    "funguo",

  "lipstick":
    "lipstick",

  "casual dresses":
    "magauni ya kawaida",

  "jeans":
    "jeans",

  "skirts":
    "sketi",

  "tops":
    "tops",

  "everyday outfits":
    "mavazi ya kila siku",

  "attending events":
    "kuhudhuria matukio",

  "meeting friends":
    "kukutana na marafiki",

  "shopping":
    "kufanya ununuzi",

  "going for casual outings":
    "kwenda kwenye matembezi ya kawaida",

  "enjoying a short trip around town":
    "kufanya safari fupi mjini",

  "essential items":
    "vitu muhimu",

  "personal items":
    "vitu vya kibinafsi",

  "everyday accessory":
    "kifaa cha matumizi ya kila siku",

  "lightweight bag":
    "mkoba mwepesi",

  "large handbag":
    "mkoba mkubwa wa mkononi",


  "Women's Mini Crossbody Fashion Bag":
    "Mkoba Mdogo wa Wanawake wa Kubebea Begani",
  "Mini Crossbody Fashion Bag":
    "Mkoba Mdogo wa Mitindo wa Kubebea Begani",
  "Mini Crossbody Bag":
    "Mkoba Mdogo wa Kubebea Begani",
  "Women's Fashion":
    "Mitindo ya Wanawake",
  "Women's":
    "wa Wanawake",
  "Adjustable shoulder strap":
    "Kamba ya Begani Inayorekebishika",
  "shoulder strap":
    "Kamba ya Begani",
  "Main compartment":
    "Sehemu Kuu ya Kuhifadhia",
  "Small inner pocket":
    "Mfuko Mdogo wa Ndani",
  "Compact and fashionable":
    "Mdogo na wa Kisasa",
  "most important personal items":
    "vitu muhimu vya kibinafsi",
  "casual outings":
    "matembezi ya kawaida",
  "short trip around town":
    "safari fupi mjini",
  "bank cards":
    "kadi za benki",
  "small accessories":
    "vifaa vidogo vya ziada",
  "across the body":
    "mwilini kwa kuvuka begani",
  "over one shoulder":
    "begani upande mmoja",
  "hands-free convenience":
    "urahisi wa kutumia bila kushika mkoba",
  "Features / Specifications":
    "Vipengele / Vipimo na Sifa",
  "Women":
    "Wanawake",
  "PU Leather":
    "Ngozi ya PU",
  "Crossbody / Shoulder":
    "Kubeba Mwilini / Begani",
  "Shopping, Dates, Parties, Travel and Casual Outings":
    "Ununuzi, Miadi, Sherehe, Safari na Matembezi ya Kawaida",
  "Small":
    "Ndogo",
  "Medium":
    "Wastani",
  "Large":
    "Kubwa",
};

const sortedPhraseEntries = Object.entries(EN_SW_PHRASES).sort(
  ([a], [b]) => b.length - a.length
);

const sortedEntries = Object.entries(EN_SW_DICTIONARY).sort(
  ([a], [b]) => b.length - a.length
);

export function translateLocal(text: string): string {
  if (!text?.trim()) return "";

  const exact = EN_SW_DICTIONARY[text.trim()];

  if (exact) {
    return exact;
  }

  let result = text;

  for (const [english, swahili] of sortedPhraseEntries) {
    const pattern = new RegExp(
      `(^|[^A-Za-z0-9])${escapeRegExp(english)}(?=$|[^A-Za-z0-9])`,
      "gi"
    );

    result = result.replace(pattern, (match, prefix) => {
      return `${prefix}${swahili}`;
    });
  }

  for (const [english, swahili] of sortedEntries) {
    const pattern = new RegExp(
      `(^|[^A-Za-z0-9])${escapeRegExp(english)}(?=$|[^A-Za-z0-9])`,
      "gi"
    );

    result = result.replace(pattern, (match, prefix) => {
      return `${prefix}${swahili}`;
    });
  }

  return result;
}

export function translateLocalArray(values: string[]): string[] {
  if (!Array.isArray(values)) return [];

  return values.map((value) => translateLocal(value));
}

export function translateLocalObject(
  values: Record<string, string>
): Record<string, string> {
  if (!values || typeof values !== "object") return {};

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      translateLocal(String(key ?? "")),
      translateLocal(String(value ?? "")),
    ])
  );
}
