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
    "White",
    "Gray",
    "Silver",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Pink",
    "Purple",
    "Brown",
    "Beige",
    "Navy Blue",
    "Gold",
    "Multicolour",
    "Other",
  ];

  async function loadProducts() {
    const data = await getProducts();

    setProducts(data);

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
            "ring-blue-500"
          );

          window.setTimeout(() => {
            element.classList.remove(
              "ring-2",
              "ring-blue-500"
            );
          }, 2000);
        }
      });
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


    setForm((current) => {
      const allImages = [
        ...current.images,
        ...uploaded,
      ];

      return {
        ...current,
        images: allImages,
        image:
          uploaded[0] ||
          current.image ||
          allImages[0] ||
          "",
      };
    });


    setUploading(false);

  }

  async function detectColoursForImages(
    images: string[],
    overwrite: boolean
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
        !Array.isArray(result.colors) ||
        !result.colors.length
      ) {
        return;
      }

      const detectedColors = result.colors
        .map(
          (item: {
            name?: unknown;
            confidence?: unknown;
          }) => {
            const name =
              typeof item?.name === "string"
                ? item.name.trim()
                : "";

            const confidence =
              typeof item?.confidence === "number"
                ? Math.max(
                    0,
                    Math.min(1, item.confidence)
                  )
                : null;

            if (!name || confidence === null) {
              return null;
            }

            return {
              name,
              confidence,
            };
          }
        )
        .filter(
          (
            item: {
              name: string;
              confidence: number;
            } | null
          ): item is {
            name: string;
            confidence: number;
          } => item !== null
        );

      if (!detectedColors.length) return;

      setDetectedColorReview(detectedColors);

      setForm((current) => {
        if (!overwrite && current.colors.trim()) {
          return current;
        }

        return {
          ...current,
          colors: detectedColors
            .map(
              (item: {
                name: string;
                confidence: number;
              }) => item.name
            )
            .join(", "),
        };
      });
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

    const manuallyEnteredColours = form.colors
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const mappedColours = Object.keys(imageColorMap);

    const mergedColours = [
      ...manuallyEnteredColours,
      ...mappedColours,
    ].filter(
      (colour, index, list) =>
        list.findIndex(
          (item) =>
            item.toLowerCase() === colour.toLowerCase()
        ) === index
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
      alert("Please add at least one product image.");
      return;
    }

    try {
      setDetectingColors(true);

      const response = await fetch(
        "/api/products/detect-colors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images,
          }),
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.colors) ||
        !result.colors.length
      ) {
        throw new Error(
          "Unable to detect product colours. Please enter the colours manually or try again."
        );
      }

      const detectedColors = result.colors
        .map(
          (item: { name?: unknown }) =>
            typeof item?.name === "string"
              ? item.name.trim()
              : ""
        )
        .filter(Boolean);

      if (!detectedColors.length) {
        throw new Error(
          "Unable to detect product colours. Please enter the colours manually or try again."
        );
      }

      setForm((current) => ({
        ...current,
        colors: detectedColors.join(", "),
      }));
    } catch (error) {
      console.error(
        "Product colour detection failed:",
        error
      );

      alert(
        "Unable to detect product colours. Please enter the colours manually or try again."
      );
    } finally {
      setDetectingColors(false);
    }
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
    <main className="p-6 bg-gray-100 min-h-screen">


      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Products Management
        </h1>




      </div>

      {showForm && (

        <form
          onSubmit={handleSubmit}
          className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
        >

          <div className="border-b border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              ← Back to Products
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Add complete product information, pricing and variations.
            </p>
          </div>

          <div className="space-y-6 p-6">

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Basic Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Product Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Naviforce Steel Watch"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Selling Price
                  </label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Old Price
                  </label>
                  <input
                    name="oldPrice"
                    type="number"
                    value={form.oldPrice}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Selling Cost
                  </label>
                  <input
                    name="cost_price"
                    type="number"
                    value={form.cost_price}
                    onChange={handleChange}
                    placeholder="Your buying cost"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Used to calculate your profit.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Stock
                  </label>
                  <input
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="Available quantity"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Product Variations
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Colors
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="colors"
                      value={form.colors}
                      onChange={handleChange}
                      placeholder="Black, Red, Blue"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={redetectProductColours}
                      disabled={detectingColors}
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {detectingColors
                        ? "Detecting..."
                        : "Re-detect Colours"}
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    Enter colours manually or use Re-detect Colours to analyse the product images.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Sizes
                  </label>
                  <input
                    name="sizes"
                    value={form.sizes}
                    onChange={handleChange}
                    placeholder="S, M, L, XL"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">
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
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="grid grid-cols-3 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-600">
                          <div className="border-r border-gray-200 px-3 py-2.5">
                            Size
                          </div>
                          <div className="border-r border-gray-200 px-3 py-2.5">
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
                              className="border-t border-gray-200"
                            >
                              <div className="grid grid-cols-3">
                                <div className="flex items-center border-r border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700">
                                  {size}
                                </div>

                                <div className="border-r border-gray-200 p-2">
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
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                  />

                                  <div className="mt-1 text-[11px] text-gray-400">
                                    Available: {remainingBefore}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-gray-100 px-3 py-1.5 text-right text-[11px] text-gray-400">
                                Remaining after {size}: {remainingAfter}
                              </div>
                            </div>
                          );
                        })}

                        <div className="border-t-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold">
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
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
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
              className="bg-gray-800 text-white px-4 rounded"
            >
              Add
            </button>

              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Product Description
              </h3>

              <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Product description"
            rows={6}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
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
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4">
                    <h4 className="text-base font-black text-gray-900">
                      Assign Colour to Each Image
                    </h4>

                    <p className="mt-1 text-xs text-gray-600">
                      Choose the exact colour for every image. Multiple images
                      can use the same colour. Your selection is saved with the product.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {form.images.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                      >
                        <div className="relative aspect-square bg-gray-50">
                          <img
                            src={url}
                            alt={`${form.name || "Product"} image ${index + 1}`}
                            className="h-full w-full object-contain"
                          />

                          {form.image === url && (
                            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white">
                              MAIN
                            </span>
                          )}
                        </div>

                        <div className="p-3">
                          <label className="mb-1 block text-xs font-bold text-gray-600">
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
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
                          >
                            {form.image === url
                              ? "✓ Main Image"
                              : "Set as Main"}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-white px-3 py-3 text-xs text-gray-600 ring-1 ring-inset ring-gray-200">
                    <span className="font-bold text-gray-900">
                      How it works:
                    </span>{" "}
                    Black images are shown when the customer selects Black,
                    White images when White is selected, and so on.
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  Uploading images...
                </div>
              )}

            </section>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {editingId ? "Ready to update?" : "Ready to publish?"}
                </p>
                <p className="text-xs text-gray-400">
                  Check price, cost, stock and variations before saving.
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Update Product" : "Save Product"}
              </button>
            </div>

          </div>
        </form>

      )}



      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Product Categories
          </h2>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto rounded-lg bg-red-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-700"
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
                  ? "border-[#800020] bg-[#800020] text-white shadow-md"
                  : "border-[#800020] bg-white text-[#800020] hover:bg-[#800020] hover:text-white"
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
          className="bg-white p-4 rounded shadow flex justify-between transition-all duration-300"
        >

          <div>

            <h2 className="font-bold">
              {product.name}
            </h2>

            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-sm text-gray-600 sm:grid-cols-4">
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
                <span className="font-bold text-green-600">
                  TZS {(Number(product.price || 0) - Number(product.cost_price || 0)).toLocaleString()}
                </span>
              </p>

              <p>
                <span className="font-semibold">Stock:</span>{" "}
                {product.stock}
              </p>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              <span className="font-semibold">Category:</span>{" "}
              {product.category || "—"}
            </p>

            {(product.colors?.length || product.sizes?.length) ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {product.colors?.map((color) => (
                  <span
                    key={`color-${color}`}
                    className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700"
                  >
                    {color}
                  </span>
                ))}

                {product.sizes?.map((size) => (
                  <span
                    key={`size-${size}`}
                    className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700"
                  >
                    {size}
                  </span>
                ))}
              </div>
            ) : null}

          </div>



          <div className="space-x-2">


            <button
              onClick={()=>editProduct(product)}
              className="bg-yellow-500 text-white px-3 py-2 rounded"
            >
              Edit
            </button>


            <button
              onClick={()=>removeProduct(product.id)}
              className="bg-red-600 text-white px-3 py-2 rounded"
            >
              Delete
            </button>


          </div>


        </div>

      ))}

      </div>


    </main>
  );

}
