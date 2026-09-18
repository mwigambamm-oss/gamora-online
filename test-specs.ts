import { extractSpecifications } from "./lib/translation/extractSpecifications";

const description = `This Women's Mini Crossbody Fashion Bag is a compact and stylish everyday accessory designed for women who prefer a lightweight bag for carrying their most important personal items.

Features / Specifications:

Material: PU Leather
Bag Type: Mini Crossbody Bag
Size: Small
Closure: Zipper
Strap: Adjustable shoulder strap
Interior: Main compartment
Pockets: Small inner pocket
Design: Compact and fashionable
Weight: Lightweight
Carrying Style: Crossbody / Shoulder
Suitable For: Shopping, Dates, Parties, Travel and Casual Outings
Gender: Women
Available Colours: Black, Brown, Pink and Beige`;

console.log(JSON.stringify(extractSpecifications(description), null, 2));
