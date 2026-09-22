"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
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

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All Products");

  const [uploading, setUploading] = useState(false);

  type ColorDetection = {
    image: string;
    detectedColor: string;
    confidence: number;
    coverage: number;
    percentage: number;
    decision: "auto" | "review";
    alternatives: {
      color: string;
      confidence: number;
      coverage: number;
      percentage: number;
      decision: "auto" | "review";
    }[];
  };

  const [colorDetections, setColorDetections] = useState<
    ColorDetection[]
  >([]);

  const [detectingColors, setDetectingColors] = useState(false);

  // Product waits here until the seller reviews and confirms
  // the detected image colours.
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  const [pendingAction, setPendingAction] = useState<
    "add" | "update" | null
  >(null);


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



  async function analyzeProductImages(product: any) {
    try {
      setDetectingColors(true);

      const images = Array.isArray(product?.images)
        ? product.images.filter(
            (url: unknown): url is string =>
              typeof url === "string" &&
              url.trim().length > 0
          )
        : [];

      const colors = Array.isArray(product?.colors)
        ? product.colors.filter(
            (color: unknown): color is string =>
              typeof color === "string" &&
              color.trim().length > 0
          )
        : [];

      if (!images.length) {
        alert("Please add at least one product image.");
        return false;
      }

      const response = await fetch(
        "/api/admin/products/0/detect-colors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images,
            colors,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            "OpenCV image color detection failed"
        );
      }

      const detections = Array.isArray(
        result.imageDetections
      )
        ? result.imageDetections
        : [];

      setColorDetections(detections);

      setPendingProduct(product);

      setPendingAction(
        editingId ? "update" : "add"
      );

      return true;
    } catch (error) {
      console.error(
        "OpenCV image color detection failed:",
        error
      );

      setColorDetections([]);

      alert(
        error instanceof Error
          ? error.message
          : "Colour detection failed."
      );

      return false;
    } finally {
      setDetectingColors(false);
    }
  }


  async function confirmColorMapping() {
    if (
      !pendingProduct ||
      !colorDetections.length ||
      !pendingAction
    ) {
      return;
    }

    try {
      const imageColorMap: Record<
        string,
        { images: string[]; confidence: number }
      > = {};

      const confirmedColors = [
        ...(Array.isArray(pendingProduct.colors)
          ? pendingProduct.colors
          : []),
      ];

      for (const detection of colorDetections) {
        const color =
          detection.detectedColor.trim();

        if (!color) continue;

        if (
          !confirmedColors.some(
            (existing: string) =>
              existing.toLowerCase() ===
              color.toLowerCase()
          )
        ) {
          confirmedColors.push(color);
        }

        if (!imageColorMap[color]) {
          imageColorMap[color] = {
            images: [],
            confidence:
              detection.confidence,
          };
        }

        imageColorMap[color].images.push(
          detection.image
        );

        imageColorMap[color].confidence =
          Math.max(
            imageColorMap[color].confidence,
            detection.confidence
          );
      }

      for (const color of Object.keys(
        imageColorMap
      )) {
        imageColorMap[color].images = [
          ...new Set(
            imageColorMap[color].images
          ),
        ];
      }

      const finalProduct = {
        ...pendingProduct,
        colors: confirmedColors,
        image_color_map: imageColorMap,
      };

      if (
        pendingAction === "update" &&
        editingId
      ) {
        await updateProduct(
          editingId,
          finalProduct
        );

        alert(
          "Product updated successfully."
        );
      } else {
        await saveProduct(finalProduct);

        alert(
          "Product added successfully."
        );
      }

      setColorDetections([]);
      setPendingProduct(null);
      setPendingAction(null);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error(
        "Failed saving confirmed product:",
        error
      );

      alert(
        "Failed to save the product."
      );
    }
  }


  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (
      !form.name ||
      !form.price ||
      form.stock === ""
    ) {
      alert(
        "Product name, price and stock required"
      );
      return;
    }

    const product: any = {
      name: form.name,

      price: Number(form.price),

      oldPrice: Number(
        form.oldPrice || form.price
      ),

      cost_price: Number(
        form.cost_price || 0
      ),

      category: form.category,

      stock: Number(form.stock),

      colors: form.colors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

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
            const value =
              form.sizePrices[size];

            return [
              size,
              value !== undefined &&
              value !== ""
                ? Number(value)
                : undefined,
            ];
          })
          .filter(
            ([, value]) =>
              value !== undefined
          )
      ),

      sizeQuantities: Object.fromEntries(
        form.sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((size) => {
            const value =
              form.sizeQuantities[size];

            return [
              size,
              value !== undefined &&
              value !== ""
                ? Number(value)
                : undefined,
            ];
          })
          .filter(
            ([, value]) =>
              value !== undefined
          )
      ),

      description: form.description,

      specifications:
        extractSpecifications(
          form.description
        ),

      image:
        form.images?.[0] ||
        form.image ||
        "",

      images:
        Array.isArray(form.images)
          ? form.images.filter(
              (url) =>
                typeof url === "string" &&
                url.startsWith("http")
            )
          : [],
    };

    // IMPORTANT:
    // Do not save/update the database yet.
    // First detect the colours and show the
    // seller the review screen.
    const detected =
      await analyzeProductImages(
        product
      );

    if (!detected) {
      return;
    }
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

    setEditingId(product.id);
    setShowForm(true);
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
                  <input
                    name="colors"
                    value={form.colors}
                    onChange={handleChange}
                    placeholder="Black, Red, Blue"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate colors with commas.
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

    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        ...uploaded,
      ],
      image:
        current.image ||
        uploaded[0] ||
        "",
    }));

    setUploading(false);
  }}
/>


              {uploading && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  Uploading images...
                </div>
              )}

              {detectingColors && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  OpenCV is detecting product colors...
                </div>
              )}

              {colorDetections.length > 0 && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-800">
                      OpenCV Color Detection
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Review each image and correct the detected color if necessary.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colorDetections.map((detection, index) => (
                      <div
                        key={`${detection.image}-${index}`}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                      >
                        <div className="aspect-square bg-white">
                          <img
                            src={detection.image}
                            alt={`Product image ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="space-y-3 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-500">
                                Detected product color
                              </p>
                              <p className="mt-1 text-sm font-bold text-gray-900">
                                {detection.detectedColor}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                detection.decision === "auto"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {detection.decision === "auto"
                                ? "AUTO SELECTED"
                                : "REVIEW REQUIRED"}
                            </span>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">
                                Product colour share
                              </span>
                              <span className="text-sm font-extrabold text-gray-900">
                                {Math.round(detection.percentage * 100)}%
                              </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full ${
                                  detection.decision === "auto"
                                    ? "bg-green-500"
                                    : "bg-amber-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round(
                                      detection.percentage * 100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="mt-2 text-[11px] text-gray-400">
                              Detection confidence:{" "}
                              {Math.round(
                                detection.confidence * 100
                              )}
                              %
                            </p>
                          </div>

                          <select
                            value={detection.detectedColor}
                            onChange={(e) => {
                              const value = e.target.value;

                              setColorDetections((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        detectedColor: value,
                                        decision: "review",
                                      }
                                    : item
                                )
                              );
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500"
                          >
                            {Array.from(
                              new Set(
                                form.colors
                                  .split(",")
                                  .map((color) => color.trim())
                                  .filter(Boolean)
                              )
                            ).map((color) => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>

                          {detection.alternatives.length > 1 && (
                            <div className="rounded-lg border border-gray-100 bg-white p-3">
                              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                Colour evidence
                              </p>

                              <div className="space-y-1.5">
                                {detection.alternatives
                                  .slice(0, 4)
                                  .map((item) => (
                                    <button
                                      key={item.color}
                                      type="button"
                                      onClick={() => {
                                        setColorDetections((current) =>
                                          current.map(
                                            (currentItem, currentIndex) =>
                                              currentIndex === index
                                                ? {
                                                    ...currentItem,
                                                    detectedColor:
                                                      item.color,
                                                    percentage:
                                                      item.percentage,
                                                    confidence:
                                                      item.confidence,
                                                    decision: "review",
                                                  }
                                                : currentItem
                                          )
                                        );
                                      }}
                                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                                        item.color.toLowerCase() ===
                                        detection.detectedColor.toLowerCase()
                                          ? "bg-gray-100 font-bold text-gray-900"
                                          : "text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      <span>{item.color}</span>
                                      <span className="font-bold">
                                        {Math.round(
                                          item.percentage * 100
                                        )}
                                        %
                                      </span>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Review complete?
                      </p>
                      <p className="text-xs text-gray-400">
                        Confirm the colors to save the image-to-color mapping.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={confirmColorMapping}
                      className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                    >
                      Confirm Colors
                    </button>
                  </div>
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
          key={product.id}
          className="bg-white p-4 rounded shadow flex justify-between"
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
