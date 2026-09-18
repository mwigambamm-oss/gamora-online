import { createClient } from "@supabase/supabase-js";

import {
  translateToSwahili,
  translateSpecificationsToSwahili,
} from "../lib/translation/translate";

import { extractSpecifications } from "../lib/translation/extractSpecifications";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  specifications: Record<string, string> | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL au SUPABASE_SERVICE_ROLE_KEY haipo kwenye .env.local"
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  console.log("========================================");
  console.log(" GAMORA ONLINE - BULK SWAHILI TRANSLATION");
  console.log("========================================");
  console.log("");

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      category,
      description,
      colors,
      sizes,
      specifications
    `)
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  if (!products || products.length === 0) {
    console.log("Hakuna products zilizopatikana.");
    return;
  }

  console.log(`PRODUCTS FOUND: ${products.length}`);
  console.log("");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as Product;

    try {
      /*
       * 1. Product name
       */
      const name_sw = await translateToSwahili(
        product.name || ""
      );

      /*
       * 2. Category
       */
      const category_sw = await translateToSwahili(
        product.category || ""
      );

      /*
       * 3. Description
       */
      const description_sw = await translateToSwahili(
        product.description || ""
      );

      /*
       * 4. Existing structured specifications
       */
      const existingSpecifications =
        product.specifications &&
        typeof product.specifications === "object"
          ? product.specifications
          : {};

      /*
       * 5. Specifications embedded inside description.
       */
      const embeddedSpecifications =
        extractSpecifications(
          product.description || ""
        );

      /*
       * 6. Merge both.
       *
       * Embedded specifications are added without deleting
       * existing structured specifications.
       */
      const mergedSpecifications = {
        ...embeddedSpecifications,
        ...existingSpecifications,
      };

      /*
       * 7. Translate specifications.
       */
      const specifications_sw =
        await translateSpecificationsToSwahili(
          mergedSpecifications
        );

      /*
       * 8. Colors.
       */
      const colors_sw = await Promise.all(
        (Array.isArray(product.colors) ? product.colors : [])
          .map((item) => translateToSwahili(item))
      );

      /*
       * 9. Sizes.
       */
      const sizes_sw = await Promise.all(
        (Array.isArray(product.sizes) ? product.sizes : [])
          .map((item) => translateToSwahili(item))
      );

      /*
       * 10. Save everything.
       */
      const { error: updateError } =
        await supabase
          .from("products")
          .update({
            name_sw,
            category_sw,
            description_sw,
            specifications_sw,
            colors_sw,
            sizes_sw,
          })
          .eq("id", product.id);

      if (updateError) {
        throw updateError;
      }

      success++;

      console.log(
        `[${i + 1}/${products.length}] OK  ID=${product.id}  ${product.name}`
      );
    } catch (error) {
      failed++;

      console.error(
        `[${i + 1}/${products.length}] FAILED  ID=${product.id}  ${product.name}`
      );

      console.error(error);
    }
  }

  console.log("");
  console.log("========================================");
  console.log(" TRANSLATION COMPLETE");
  console.log("========================================");
  console.log(`TOTAL   : ${products.length}`);
  console.log(`SUCCESS : ${success}`);
  console.log(`FAILED  : ${failed}`);
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("BULK TRANSLATION ERROR:");
  console.error(error);
  process.exit(1);
});
