"use client";

import { useEffect, useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  Product,
  getProducts,
  saveProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/products";
import ProductImageUploader from "./product/ProductImageUploader";
import { extractSpecifications } from "@/lib/specifications";

const DEFAULT_CATEGORIES = [
  "Phones & Electronics",
  "Computers & Accessories",
  "Men's Fashion",
  "Women's Fashion",
  "Kids Fashion",
  "Shoes",
  "Bags",
  "Beauty & Personal Care",
  "Health & Wellness",
  "Home & Kitchen",
  "Furniture",
  "Jewelry & Watches",
  "Baby Products",
  "Sports & Fitness",
  "Gaming",
  "Automotive",
  "Tools & Hardware",
  "Books & Stationery",
  "Garden & Outdoor",
  "Food & Beverages",
  "Pet Supplies",
];
export default function ProductsModule() {
  const emptyForm = {
    name: "",
    price: "",
    oldPrice: "",
    cost_price: "",
    category: "",
    stock: "",
    colors: "",
    sizes: "",
    sizePrices: {} as Record<string, string>,
    sizeQuantities: {} as Record<string, string>,
    description: "",
    image: "",
    images: [] as string[],
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const [form, setForm] = useState(emptyForm);

  const [newCategory, setNewCategory] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const restoreProductIdRef = useRef<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All Products");

  const [uploading, setUploading] = useState(false);

  const [detectingColors, setDetectingColors] = useState(false);

  const [detectedColorReview, setDetectedColorReview] = useState<
    { name: string; confidence: number }[]
  >([]);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  // Manual colour assigned to each uploaded product image.
  const [imageColors, setImageColors] = useState<Record<string, string>>({});

  const IMAGE_COLOUR_OPTIONS = [
    "Black",
    "Jet Black",
    "Onyx",
    "Ebony",
    "White",
    "Off White",
    "Snow White",
    "Pearl White",
    "Gray",
    "Light Gray",
    "Medium Gray",
    "Dark Gray",
    "Charcoal",
    "Slate Gray",
    "Ash Gray",
    "Silver",
    "Platinum",
    "Graphite",
    "Gunmetal",
    "Cream",
    "Ivory",
    "Vanilla",
    "Almond",
    "Beige",
    "Sand",
    "Taupe",
    "Greige",
    "Tan",
    "Camel",
    "Caramel",
    "Nude",
    "Mocha",
    "Coffee",
    "Khaki",
    "Brown",
    "Light Brown",
    "Dark Brown",
    "Chocolate",
    "Chestnut",
    "Cocoa",
    "Espresso",
    "Rust",
    "Terracotta",
    "Burnt Sienna",
    "Red",
    "Bright Red",
    "Scarlet",
    "Crimson",
    "Cherry Red",
    "Dark Red",
    "Brick Red",
    "Maroon",
    "Burgundy",
    "Wine",
    "Bordeaux",
    "Ruby",
    "Garnet",
    "Rose",
    "Dusty Rose",
    "Blush",
    "Pink",
    "Baby Pink",
    "Light Pink",
    "Dark Pink",
    "Hot Pink",
    "Neon Pink",
    "Magenta",
    "Fuchsia",
    "Coral",
    "Salmon",
    "Peach",
    "Apricot",
    "Mauve",
    "Orange",
    "Bright Orange",
    "Light Orange",
    "Dark Orange",
    "Burnt Orange",
    "Tangerine",
    "Amber",
    "Yellow",
    "Bright Yellow",
    "Light Yellow",
    "Lemon Yellow",
    "Mustard",
    "Golden Yellow",
    "Gold",
    "Rose Gold",
    "Champagne",
    "Green",
    "Light Green",
    "Dark Green",
    "Bright Green",
    "Forest Green",
    "Emerald Green",
    "Jade",
    "Hunter Green",
    "Pine Green",
    "Moss Green",
    "Olive",
    "Olive Green",
    "Sage Green",
    "Mint Green",
    "Seafoam Green",
    "Lime Green",
    "Neon Green",
    "Khaki Green",
    "Army Green",
    "Apple Green",
    "Pistachio",
    "Avocado",
    "Teal",
    "Dark Teal",
    "Blue Green",
    "Blue",
    "Light Blue",
    "Dark Blue",
    "Baby Blue",
    "Sky Blue",
    "Powder Blue",
    "Pastel Blue",
    "Royal Blue",
    "Navy Blue",
    "Midnight Blue",
    "Cobalt Blue",
    "Sapphire Blue",
    "Azure",
    "Cerulean",
    "Denim Blue",
    "Steel Blue",
    "Ocean Blue",
    "Petrol Blue",
    "Cyan",
    "Aqua",
    "Turquoise",
    "Purple",
    "Light Purple",
    "Dark Purple",
    "Bright Purple",
    "Violet",
    "Indigo",
    "Lavender",
    "Lilac",
    "Plum",
    "Eggplant",
    "Amethyst",
    "Orchid",
    "Periwinkle",
    "Multicolour",
    "Rainbow",
    "Clear",
    "Transparent",
    "Translucent",
    "Tortoiseshell",
    "Tortoise Shell",
    "Havana",
    "Amber Tortoiseshell",
    "Brown Tortoiseshell",
    "Animal Print",
    "Leopard Print",
    "Tiger Print",
    "Zebra Print",
    "Snake Print",
    "Cow Print",
    "Cheetah Print",
    "Giraffe Print",
    "Dalmatian Print",
    "Floral",
    "Striped",
    "Vertical Stripe",
    "Horizontal Stripe",
    "Plaid",
    "Tartan",
    "Checkered",
    "Gingham",
    "Polka Dot",
    "Houndstooth",
    "Paisley",
    "Geometric",
    "Camouflage",
    "Digital Camouflage",
    "Gradient",
    "Tie-Dye",
    "Ombre",
    "Marble",
    "Wood Grain",
    "Carbon Fiber",
    "Glitter",
    "Sparkle",
    "Shimmer",
    "Metallic",
    "Chrome",
    "Holographic",
    "Iridescent",
    "Pearlescent",
    "Glossy",
    "Matte",
    "Satin",
    "Frosted",
    "Bronze",
    "Copper",
    "Brass",
    "Titanium",
    "Nickel",
    "Other",
  ];

  async function loadProducts() {
    const data = await getProducts({
      limit: 40,
      offset: 0,
      admin: true,
    });

    setProducts(data);
    setHasMoreProducts(data.length === 40);

    const productCategories = data
      .map((p) => p.category)
      .filter(Boolean);

    setCategories(
      Array.from(
        new Set([
          ...DEFAULT_CATEGORIES,
          ...productCategories,
        ])
      )
    );

    const restoreId = restoreProductIdRef.current;

    if (restoreId !== null) {
      restoreProductIdRef.current = null;

      requestAnimationFrame(() => {
        const element = document.getElementById(
          `admin-product-${restoreId}`
        );

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          element.classList.add(
            "ring-2",
            "ring-green-600"
          );

          window.setTimeout(() => {
            element.classList.remove(
              "ring-2",
              "ring-green-600"
            );
          }, 2000);
        }
      });
    }
  }


  async function loadMoreProducts() {
    if (loadingMore || !hasMoreProducts) return;

    setLoadingMore(true);

    try {
      const data = await getProducts({
        limit: 40,
        offset: products.length,
        admin: true,
      });

      setProducts((current) => [...current, ...data]);

      if (data.length < 40) {
        setHasMoreProducts(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);


  function handleChange(
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  }


  async function uploadImages(
    e: ChangeEvent<HTMLInputElement>
  ) {

    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    setUploading(true);

    const { supabase } =
      await import("@/lib/supabase");

    const uploaded:string[] = [];


    for(const file of files){

      const fileName =
        `${Date.now()}-${file.name}`;


      const {error} =
        await supabase.storage
        .from("product-images")
        .upload(fileName,file);


      if(!error){

        const {data} =
          supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);


        uploaded.push(
          data.publicUrl
        );

      }

    }


    const allImages = [
      ...form.images,
      ...uploaded,
    ];

    setForm((current) => {
      const currentImages = [
        ...current.images,
        ...uploaded,
      ];

      return {
        ...current,
        images: currentImages,
        image:
          uploaded[0] ||
          current.image ||
          currentImages[0] ||
          "",
      };
    });

    if (allImages.length) {
      await detectColoursForImages(
        allImages,
        true
      );
    }

    setUploading(false);

  }

  async function detectColoursForImages(
    images: string[],
    overwrite: boolean = true
  ) {
    if (!images.length) return;

    try {
      setDetectingColors(true);

      const response = await fetch(
        "/api/products/detect-colors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ images }),
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.image_detections)
      ) {
        console.error(
          "Automatic colour detection failed:",
          result
        );
        return;
      }

      const detections = result.image_detections.filter(
        (item: any) =>
          typeof item?.image === "string" &&
          typeof item?.detectedColor === "string" &&
          item.detectedColor.trim()
      );

      if (!detections.length) {
        console.warn("No colours detected for uploaded images.");
        return;
      }

      /*
       * Build the complete image -> detected colour map FIRST.
       * This is important because React state updates are asynchronous.
       */
      const detectedImageColors: Record<string, string> = {};

      for (const item of detections) {
        const detectedImage = item.image.trim();
        const colour = item.detectedColor.trim();

        if (!detectedImage || !colour) continue;

        const matchedImage =
          images.find((url) => {
            const a = url.trim();
            const b = detectedImage;

            try {
              return (
                a === b ||
                decodeURIComponent(a) === decodeURIComponent(b) ||
                a.split("?")[0] === b.split("?")[0]
              );
            } catch {
              return (
                a === b ||
                a.split("?")[0] === b.split("?")[0]
              );
            }
          }) || detectedImage;

        detectedImageColors[matchedImage] = colour;
      }

      /*
       * Automatically assign colours to every image.
       * Manual editing remains possible afterwards through the dropdown.
       */
      setImageColors((current) => {
        const next = { ...current };

        for (const image of images) {
          const detected = detectedImageColors[image];

          if (
            detected &&
            (overwrite || !next[image])
          ) {
            next[image] = detected;
          }
        }

        return next;
      });

      /*
       * Automatically build Product Colors from the detected
       * colours, without requiring any manual selection.
       */
      const detectedNames: string[] = [];
      const seen = new Set<string>();

      for (const image of images) {
        const colour = detectedImageColors[image]?.trim();

        if (!colour) continue;

        const key = colour.toLowerCase();

        if (seen.has(key)) continue;

        seen.add(key);
        detectedNames.push(colour);
      }

      setDetectedColorReview(
        detectedNames.map((name) => ({
          name,
          confidence: 1,
        }))
      );

      setForm((current) => ({
        ...current,
        colors: detectedNames.join(", "),
      }));

      console.log(
        "GAMORA AUTOMATIC COLOURS:",
        detectedImageColors,
        detectedNames
      );
    } catch (error) {
      console.error(
        "Automatic product colour detection failed:",
        error
      );
    } finally {
      setDetectingColors(false);
    }
  }


  function setMainImage(url:string){
    setForm({
      ...form,
      image:url,
    });
  }

  function removeImage(url:string){

    const updated =
      form.images.filter(
        (img)=>img !== url
      );


    setForm({
      ...form,
      images:updated,
      image:
        form.image === url
          ? updated[0] || ""
          : form.image,
    });

    setImageColors((current) => {
      const next = { ...current };
      delete next[url];
      return next;
    });

  }

  function addCategory(){

    const name =
      newCategory.trim();

    if(!name) return;


    setCategories([
      ...categories,
      name,
    ]);


    setForm({
      ...form,
      category:name,
    });


    setNewCategory("");

  }

  function buildImageColourMap(
    images: string[] = [],
    assignments: Record<string, string> = imageColors
  ) {
    const map: Record<
      string,
      { images: string[]; confidence: number }
    > = {};

    for (const image of images) {
      const colour = (assignments[image] || "").trim();

      if (!colour) continue;

      if (!map[colour]) {
        map[colour] = {
          images: [],
          confidence: 1,
        };
      }

      if (!map[colour].images.includes(image)) {
        map[colour].images.push(image);
      }
    }

    return map;
  }

  function getUniqueImageColours(
    images: string[] = [],
    assignments: Record<string, string> = imageColors
  ) {
    const colours: string[] = [];
    const seen = new Set<string>();

    for (const image of images) {
      const colour = (assignments[image] || "").trim();

      if (!colour) continue;

      const key = colour.toLowerCase();

      if (seen.has(key)) continue;

      seen.add(key);
      colours.push(colour);
    }

    return colours;
  }

  function editProduct(
    product: Product
  ) {
    setForm({
      name: product.name,
      price: String(product.price),
      oldPrice: String(product.oldPrice || ""),
      cost_price: String(product.cost_price ?? ""),
      category: product.category,
      stock: String(product.stock),
      colors: (product.colors || []).join(", "),
      sizes: (product.sizes || []).join(", "),

      sizePrices: Object.fromEntries(
        Object.entries(product.sizePrices || {}).map(
          ([size, price]) => [size, String(price)]
        )
      ),

      sizeQuantities: Object.fromEntries(
        Object.entries(product.sizeQuantities || {}).map(
          ([size, quantity]) => [size, String(quantity)]
        )
      ),

      description: product.description || "",
      image: product.image || "",
      images: product.images || [],
    });

    setImageColors(
      loadImageColourAssignments(
        product.images || [],
        product.image_color_map
      )
    );

    setPendingProduct(null);
    setDetectedColorReview([]);

    setEditingId(product.id);
    setShowForm(true);
  }

  function loadImageColourAssignments(
    images: string[] = [],
    colourMap?: Product["image_color_map"]
  ) {
    const assignments: Record<string, string> = {};

    for (const image of images) {
      const match = Object.entries(colourMap || {}).find(
        ([, value]) =>
          Array.isArray(value?.images) &&
          value.images.includes(image)
      );

      assignments[image] = match ? match[0] : "";
    }

    return assignments;
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.name || !form.price || form.stock === "") {
      alert("Product name, price and stock required");
      return;
    }

    const images = Array.isArray(form.images)
      ? form.images.filter(
          (url): url is string =>
            typeof url === "string" &&
            url.startsWith("http")
        )
      : [];

    if (!images.length && !form.image) {
      alert("Please add at least one product image before saving.");
      return;
    }

    // Manual image-colour mapping is the final authority.
    const imageColorMap = buildImageColourMap(
      images,
      imageColors
    );

    // Product colours are generated automatically from
    // the colours assigned to the product images.
    const mergedColours = getUniqueImageColours(
      images,
      imageColors
    );

    const product: any = {
      name: form.name,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
      cost_price: Number(form.cost_price || 0),
      category: form.category,
      stock: Number(form.stock),

      colors: mergedColours,

      sizes: form.sizes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      sizePrices: Object.fromEntries(
        form.sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((size) => {
            const value = form.sizePrices[size];

            return [
              size,
              value !== undefined && value !== ""
                ? Number(value)
                : undefined,
            ];
          })
          .filter(([, value]) => value !== undefined)
      ),

      sizeQuantities: Object.fromEntries(
        form.sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((size) => {
            const value = form.sizeQuantities[size];

            return [
              size,
              value !== undefined && value !== ""
                ? Number(value)
                : undefined,
            ];
          })
          .filter(([, value]) => value !== undefined)
      ),

      description: form.description,
      specifications: extractSpecifications(form.description),

      image: images[0] || form.image || "",
      images,

      image_color_map: imageColorMap,
    };

    try {
      setDetectingColors(true);

      if (editingId) {
        restoreProductIdRef.current = editingId;
        await updateProduct(editingId, product);
        alert("Product updated successfully.");
      } else {
        await saveProduct(product);
        alert("Product added successfully.");
      }

      setPendingProduct(null);
      setDetectedColorReview([]);
      setImageColors({});

      setForm(emptyForm);
      setImageColors({});
      setEditingId(null);
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error("Failed saving product:", error);
      alert("Failed to save the product.");
    } finally {
      setDetectingColors(false);
    }
  }

  async function confirmPendingProduct() {
    if (!pendingProduct) return;

    const colors = detectedColorReview
      .map((item) => item.name.trim())
      .filter(Boolean);

    if (!colors.length) {
      alert("Add at least one product colour before saving.");
      return;
    }

    const confirmedProduct = {
      ...pendingProduct,
      colors,
    };

    try {
      setDetectingColors(true);

      if (editingId) {
        await updateProduct(editingId, confirmedProduct);
        alert("Product updated successfully.");
      } else {
        await saveProduct(confirmedProduct);
        alert("Product added successfully.");
      }

      setPendingProduct(null);
      setDetectedColorReview([]);
      setForm(emptyForm);
      setImageColors({});
      setEditingId(null);
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error(
        "Failed saving confirmed product:",
        error
      );

      alert("Failed to save the product.");
    } finally {
      setDetectingColors(false);
    }
  }

  async function redetectProductColours() {
    const images = Array.isArray(form.images)
      ? form.images.filter(
          (url): url is string =>
            typeof url === "string" &&
            url.trim().length > 0
        )
      : [];

    if (!images.length) {
      alert(
        "Please add at least one product image."
      );
      return;
    }

    await detectColoursForImages(
      images,
      true
    );
  }

  async function removeProduct(
    id:number
  ){

    if(
      confirm(
        "Delete product?"
      )
    ){

      await deleteProduct(id);

      loadProducts();

    }

  }



  const filteredProducts =
    products.filter((p) => {

      const matchesCategory =
        selectedCategory === "All Products" ||
        p.category === selectedCategory;

      const matchesSearch =
        p.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return matchesCategory && matchesSearch;

    });


  return (
    <main className="p-6 bg-[#EEF3F0] min-h-screen">


      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Products Management
        </h1>




      </div>

      {showForm && (

        <form
          onSubmit={handleSubmit}
          className="mb-8 overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#E2E8F0] shadow-lg"
        >

          <div className="border-b border-[#D7DEE8] bg-[#F8FAFC] px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F766E]"
            >
              ← Back to Products
            </button>
          </div>

          <div className="bg-gradient-to-r from-[#172554] via-[#183B63] to-[#0F766E] px-6 py-5 text-white">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="mt-1 text-sm text-green-100">
              Add complete product information, pricing and variations.
            </p>
          </div>

          <div className="space-y-6 p-6">

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748B]">
                Basic Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Product Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Naviforce Steel Watch"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Selling Price
                  </label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Old Price
                  </label>
                  <input
                    name="oldPrice"
                    type="number"
                    value={form.oldPrice}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Selling Cost
                  </label>
                  <input
                    name="cost_price"
                    type="number"
                    value={form.cost_price}
                    onChange={handleChange}
                    placeholder="Your buying cost"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Used to calculate your profit.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Stock
                  </label>
                  <input
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="Available quantity"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                </div>

              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748B]">
                Product Variations
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Colors
                  </label>

                  <input
                    name="colors"
                    value={getUniqueImageColours(
                      form.images,
                      imageColors
                    ).join(", ")}
                    readOnly
                    placeholder="Assign a colour to each product image"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#EEF3F0] p-3.5 font-semibold text-[#1E293B] outline-none"
                  />

                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Automatically generated from the colour assigned to each product image.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Sizes
                  </label>
                  <input
                    name="sizes"
                    value={form.sizes}
                    onChange={handleChange}
                    placeholder="S, M, L, XL"
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                  />
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Separate sizes with commas.
                  </p>

                  {(() => {
                    const sizeList = form.sizes
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);

                    const totalStock = Number(form.stock || 0);

                    let allocated = 0;

                    return sizeList.length > 0 ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#E2E8F0]">
                        <div className="grid grid-cols-3 bg-[#F8FAF9] text-xs font-bold uppercase tracking-wide text-[#64748B]">
                          <div className="border-r border-[#CBD5E1] px-3 py-2.5">
                            Size
                          </div>
                          <div className="border-r border-[#CBD5E1] px-3 py-2.5">
                            Optional Price
                          </div>
                          <div className="px-3 py-2.5">
                            Quantity
                          </div>
                        </div>

                        {sizeList.map((size) => {
                          const currentQuantity = Number(
                            form.sizeQuantities[size] || 0
                          );

                          const remainingBefore =
                            Math.max(0, totalStock - allocated);

                          allocated += currentQuantity;

                          const remainingAfter =
                            Math.max(0, totalStock - allocated);

                          return (
                            <div
                              key={size}
                              className="border-t border-[#CBD5E1]"
                            >
                              <div className="grid grid-cols-3">
                                <div className="flex items-center border-r border-[#CBD5E1] px-3 py-2.5 text-sm font-semibold text-[#475569]">
                                  {size}
                                </div>

                                <div className="border-r border-[#CBD5E1] p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={form.sizePrices[size] ?? ""}
                                    onChange={(e) =>
                                      setForm((current) => ({
                                        ...current,
                                        sizePrices: {
                                          ...current.sizePrices,
                                          [size]: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={`Main: ${form.price || "—"}`}
                                    className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAF9] px-3 py-2 text-sm outline-none focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                                  />
                                </div>

                                <div className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={remainingBefore + currentQuantity}
                                    value={form.sizeQuantities[size] ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const numericValue =
                                        value === "" ? 0 : Number(value);

                                      const maxAllowed =
                                        remainingBefore + currentQuantity;

                                      if (numericValue > maxAllowed) {
                                        alert(
                                          `Only ${maxAllowed} units are available for size ${size}.`
                                        );
                                        return;
                                      }

                                      setForm((current) => ({
                                        ...current,
                                        sizeQuantities: {
                                          ...current.sizeQuantities,
                                          [size]: value,
                                        },
                                      }));
                                    }}
                                    placeholder={String(remainingBefore)}
                                    className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAF9] px-3 py-2 text-sm outline-none focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5]"
                                  />

                                  <div className="mt-1 text-[11px] text-[#94A3B8]">
                                    Available: {remainingBefore}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-[#E2E8F0] px-3 py-1.5 text-right text-[11px] text-[#94A3B8]">
                                Remaining after {size}: {remainingAfter}
                              </div>
                            </div>
                          );
                        })}

                        <div className="border-t-2 border-[#CBD5E1] bg-[#F8FAF9] px-3 py-2.5 text-xs font-semibold">
                          <div className="flex justify-between">
                            <span>Total Stock</span>
                            <span>{totalStock}</span>
                          </div>
                          <div className="mt-1 flex justify-between">
                            <span>Allocated to Sizes</span>
                            <span>{allocated}</span>
                          </div>
                          <div className="mt-1 flex justify-between">
                            <span>Remaining</span>
                            <span>
                              {Math.max(0, totalStock - allocated)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748B]">
                Category
              </h3>

              <div className="flex flex-col gap-3 md:flex-row">

            <select
  name="category"
  value={form.category}
  onChange={handleChange}
  className="border p-3 rounded w-full"
>
  <option value="">
    Select Category
  </option>

  {categories.map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}

</select>


            <input
              value={newCategory}
              onChange={(e)=>
                setNewCategory(e.target.value)
              }
              placeholder="New category"
              className="border p-3 rounded"
            />


            <button
              type="button"
              onClick={addCategory}
              className="bg-[#172554] text-white px-4 rounded hover:bg-[#0F766E]"
            >
              Add
            </button>

              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748B]">
                Product Description
              </h3>

              <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Product description"
            rows={6}
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-3.5 outline-none transition focus:border-[#172554] focus:bg-[#F8FAFC] focus:ring-2 focus:ring-[#D1FAE5] resize-none"
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748B]">
                Product Images
              </h3>

<ProductImageUploader
  initialImages={form.images}
  onMainChange={(url) => {
    // Preview URLs are temporary blob URLs.
    // The uploaded Supabase public URL is assigned in onChange.
    if (!url.startsWith("blob:")) {
      setForm((current) => ({
        ...current,
        image: url,
      }));
    }
  }}
  onChange={async (files) => {
    if (!files.length) return;

    setUploading(true);

    const { supabase } =
      await import("@/lib/supabase");

    const uploaded: string[] = [];

    for (const file of files) {
      const fileName =
        `${Date.now()}-${file.name}`;

      const { error } =
        await supabase.storage
          .from("product-images")
          .upload(fileName, file);

      if (error) {
        console.error("Image upload failed:", error);
        alert(`Image upload failed: ${error.message}`);
        continue;
      }

      const { data } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

      if (data?.publicUrl) {
        uploaded.push(data.publicUrl);
      }
    }

    if (!uploaded.length) {
      setUploading(false);
      return;
    }

    const currentImages = form.images || [];
    const allImages = [
      ...currentImages,
      ...uploaded,
    ];

    setForm((current) => ({
      ...current,
      images: allImages,
      image:
        current.image ||
        uploaded[0] ||
        "",
    }));

    setImageColors((current) => {
      const next = { ...current };

      for (const url of uploaded) {
        if (!(url in next)) {
          next[url] = "";
        }
      }

      return next;
    });

    setUploading(false);


  }}
/>

              {form.images?.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#CBD5E1] bg-[#F8FAF9] p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-black text-[#1E293B]">
                        Assign Colour to Each Image
                      </h4>

                      <p className="mt-1 text-xs text-[#64748B]">
                        Detect the product colour automatically for every image.
                        You can still correct any image manually below.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={redetectProductColours}
                      disabled={detectingColors || uploading}
                      className="shrink-0 rounded-lg bg-[#172554] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {detectingColors
                        ? "Detecting Colours..."
                        : "Detect Colours"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {form.images.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#E2E8F0]"
                      >
                        <div className="relative aspect-square bg-[#F8FAF9]">
                          <img
                            src={url}
                            alt={`${form.name || "Product"} image ${index + 1}`}
                            className="h-full w-full object-contain"
                          />

                          {form.image === url && (
                            <span className="absolute left-2 top-2 rounded-full bg-[#172554] px-2 py-1 text-[10px] font-black text-white">
                              MAIN
                            </span>
                          )}
                        </div>

                        <div className="p-3">
                          <label className="mb-1 block text-xs font-bold text-[#64748B]">
                            Image {index + 1} Colour
                          </label>

                          <select
                            value={imageColors[url] || ""}
                            onChange={(e) => {
                              const colour = e.target.value;

                              setImageColors((current) => ({
                                ...current,
                                [url]: colour,
                              }));
                            }}
                            className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#1E293B] outline-none focus:border-[#172554] focus:ring-2 focus:ring-[#D1FAE5]"
                          >
                            <option value="">
                              Default / No Colour
                            </option>

                            {IMAGE_COLOUR_OPTIONS.map((colour) => (
                              <option
                                key={colour}
                                value={colour}
                              >
                                {colour}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setMainImage(url)}
                            className="mt-2 w-full rounded-lg bg-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#475569] transition hover:bg-[#CBD5E1]"
                          >
                            {form.image === url
                              ? "✓ Main Image"
                              : "Set as Main"}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="mt-2 w-full rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-[#E2E8F0] px-3 py-3 text-xs text-[#64748B] ring-1 ring-inset ring-[#CBD5E1]">
                    <span className="font-bold text-[#1E293B]">
                      How it works:
                    </span>{" "}
                    Black images are shown when the customer selects Black,
                    White images when White is selected, and so on.
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mt-3 rounded-xl bg-[#ECFEFF] px-4 py-3 text-sm font-medium text-[#0F766E]">
                  Uploading images...
                </div>
              )}

            </section>

            <div className="flex flex-col gap-3 border-t border-[#D7DEE8] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#475569]">
                  {editingId ? "Ready to update?" : "Ready to publish?"}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Check price, cost, stock and variations before saving.
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-[#0F766E] px-7 py-3.5 font-bold text-white shadow-md transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Update Product" : "Save Product"}
              </button>
            </div>

          </div>
        </form>

      )}



      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#172033]">
            Product Categories
          </h2>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto rounded-lg bg-[#172554] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#0F766E]"
          >
            + Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {[
            {
              name: "All Products",
              image: "/home-page-sample.jpeg",
            },
            {
              name: "Phones & Electronics",
              image: "/images/phone.jpg",
            },
            {
              name: "Computers & Accessories",
              image: "/images/categories/computers.jpg",
            },
            {
              name: "Men's Fashion",
              image: "/images/mens-fashion.jpg",
            },
            {
              name: "Women's Fashion",
              image: "/images/womens-fashion.jpg",
            },
            {
              name: "Kids Fashion",
              image: "/images/categories/baby.jpg",
            },
            {
              name: "Shoes",
              image: "/images/shoes.jpg",
            },
            {
              name: "Bags",
              image: "/handbag.jpg",
            },
            {
              name: "Beauty & Personal Care",
              image: "/images/categories/beauty.jpg",
            },
            {
              name: "Health & Wellness",
              image: "/images/categories/health.jpg",
            },
            {
              name: "Home & Kitchen",
              image: "/images/home-kitchen.jpg",
            },
            {
              name: "Furniture",
              image: "/images/categories/furniture.jpg",
            },
            {
              name: "Jewelry & Watches",
              image: "/images/categories/jewelry.jpg",
            },
            {
              name: "Baby Products",
              image: "/images/categories/baby.jpg",
            },
            {
              name: "Sports & Fitness",
              image: "/images/categories/sports.jpg",
            },
            {
              name: "Gaming",
              image: "/images/categories/gaming.jpg",
            },
            {
              name: "Automotive",
              image: "/images/categories/automotive.jpg",
            },
            {
              name: "Tools & Hardware",
              image: "/images/categories/home.jpg",
            },
            {
              name: "Books & Stationery",
              image: "/images/categories/books.jpg",
            },
            {
              name: "Garden & Outdoor",
              image: "/images/categories/garden.jpg",
            },
            {
              name: "Food & Beverages",
              image: "/home-page-sample.jpeg",
            },
            {
              name: "Pet Supplies",
              image: "/home-page-sample.jpeg",
            },
          ].map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setSelectedCategory(category.name)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                selectedCategory === category.name
                  ? "border-[#0F766E] bg-[#0F766E] text-white shadow-md"
                  : "border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] hover:border-[#0F766E] hover:bg-[#ECFEFF] hover:text-[#0F766E]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <input
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder="Search products..."
        className="border p-3 rounded w-full mb-5"
      />



      <div className="space-y-3">

      {filteredProducts.map((product)=>(

        <div
          id={`admin-product-${product.id}`}
          key={product.id}
          className="bg-[#E2E8F0] border border-[#CBD5E1] p-4 rounded shadow flex justify-between gap-4 transition-all duration-300"
        >

          <div className="flex min-w-0 flex-1 gap-4">

            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-[#F8FAF9]">
              {product.images?.[0] || product.image ? (
                <img
                  src={product.images?.[0] || product.image || ""}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#94A3B8]">
                  No image
                </div>
              )}
            </div>

            <div className="min-w-0">

            <h2 className="font-bold">
              {product.name}
            </h2>

            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-sm text-[#64748B] sm:grid-cols-4">
              <p>
                <span className="font-semibold">Price:</span>{" "}
                TZS {product.price.toLocaleString()}
              </p>

              <p>
                <span className="font-semibold">Cost:</span>{" "}
                TZS {Number(product.cost_price || 0).toLocaleString()}
              </p>

              <p>
                <span className="font-semibold">Profit:</span>{" "}
                <span className="font-bold text-[#172554]">
                  TZS {(Number(product.price || 0) - Number(product.cost_price || 0)).toLocaleString()}
                </span>
              </p>

              <p>
                <span className="font-semibold">Stock:</span>{" "}
                {product.stock}
              </p>
            </div>

            <p className="mt-2 text-sm text-[#64748B]">
              <span className="font-semibold">Category:</span>{" "}
              {product.category || "—"}
            </p>

            {(product.colors?.length || product.sizes?.length) ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {product.colors?.map((color) => (
                  <span
                    key={`color-${color}`}
                    className="rounded-full bg-[#F3E8FF] px-3 py-1 font-medium text-[#7C3AED]"
                  >
                    {color}
                  </span>
                ))}

                {product.sizes?.map((size) => (
                  <span
                    key={`size-${size}`}
                    className="rounded-full bg-[#EEF3F0] px-3 py-1 font-medium text-[#475569]"
                  >
                    {size}
                  </span>
                ))}
              </div>
            ) : null}

            </div>

          </div>



          <div className="space-x-2">


            <button
              onClick={()=>editProduct(product)}
              className="bg-[#F59E0B] text-white px-3 py-2 rounded hover:bg-[#D97706]"
            >
              Edit
            </button>


            <button
              onClick={()=>removeProduct(product.id)}
              className="bg-[#172554] text-white px-3 py-2 rounded hover:bg-[#0F766E]"
            >
              Delete
            </button>


          </div>


        </div>

      ))}

      </div>



      {hasMoreProducts && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMoreProducts}
            disabled={loadingMore}
            className="rounded-xl bg-[#172554] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load More Products"}
          </button>
        </div>
      )}

    </main>
  );

}
