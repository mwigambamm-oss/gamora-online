import fs from "fs";

async function main() {
  // Load .env.local manually
  const envPath = ".env.local";

  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");

    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const index = trimmed.indexOf("=");

      if (index === -1) continue;

      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }

  const { supabase } = await import("../lib/supabase");
  const { extractSpecifications } = await import(
    "../lib/specifications"
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("id, description");

  if (error) {
    throw error;
  }

  console.log(`Found ${products?.length || 0} products.`);

  let updated = 0;

  for (const product of products || []) {
    const specifications = extractSpecifications(
      product.description || ""
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ specifications })
      .eq("id", product.id);

    if (updateError) {
      console.error(
        `Failed product ${product.id}:`,
        updateError.message
      );
      continue;
    }

    updated++;

    const specCount = Object.keys(specifications).length;

    console.log(
      `Updated product ${product.id} — ${specCount} specifications`
    );
  }

  console.log("");
  console.log(`DONE. Updated ${updated} products.`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
