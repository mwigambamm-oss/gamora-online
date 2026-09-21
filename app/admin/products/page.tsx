"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Product,
  ProductVariant,
  getProducts,
  deleteProduct,
} from "@/lib/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "low" | "out"
  >("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const emptyForm = {
    name: "",
    name_sw: "",
    price: "",
    oldPrice: "",
    category: "Women's Fashion",
    category_sw: "",
    stock: "",
    cost_price: "",
    description: "",
    description_sw: "",
    image: "",
    images: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    sizePrices: {} as Record<string, string>,
    storageOptions: [] as {
      storage: string;
      price: string;
      stock: string;
    }[],
    discount: 0,
  };

  const [form, setForm] = useState(emptyForm);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantSaving, setVariantSaving] = useState(false);

  const emptyVariant = {
    color: "",
    size: "",
    model: "",
    sku: "",
    price: "",
    old_price: "",
    stock: "0",
    images: [] as string[],
    is_active: true,
  };

  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(
    null
  );

  async function loadProducts() {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      alert("Failed to load products.");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadVariants(productId: number) {
    setVariantLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/variants`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to load product variants."
        );
      }

      setVariants(Array.isArray(result.variants) ? result.variants : []);
    } catch (error) {
      console.error("Load variants error:", error);
      setVariants([]);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load product variants."
      );
    } finally {
      setVariantLoading(false);
    }
  }

  function resetVariantForm() {
    setVariantForm(emptyVariant);
    setEditingVariantId(null);
  }

  async function saveVariant() {
    if (editingId === null) {
      alert("Save the product first before adding variants.");
      return;
    }

    if (!variantForm.sku.trim()) {
      alert("SKU is required.");
      return;
    }

    if (
      variantForm.price !== "" &&
      (!Number.isFinite(Number(variantForm.price)) ||
        Number(variantForm.price) < 0)
    ) {
      alert("Variant price must be zero or greater.");
      return;
    }

    if (
      !Number.isFinite(Number(variantForm.stock)) ||
      Number(variantForm.stock) < 0
    ) {
      alert("Variant stock must be zero or greater.");
      return;
    }

    setVariantSaving(true);

    try {
      const endpoint =
        editingVariantId !== null
          ? `/api/admin/products/${editingVariantId}/variants`
          : `/api/admin/products/${editingId}/variants`;

      const response = await fetch(endpoint, {
        method: editingVariantId !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          color: variantForm.color.trim(),
          size: variantForm.size.trim(),
          model: variantForm.model.trim(),
          sku: variantForm.sku.trim(),
          price:
            variantForm.price === ""
              ? null
              : Number(variantForm.price),
          old_price:
            variantForm.old_price === ""
              ? null
              : Number(variantForm.old_price),
          stock: Number(variantForm.stock),
          images: variantForm.images,
          is_active: variantForm.is_active,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to save variant."
        );
      }

      await loadVariants(editingId);
      resetVariantForm();

      alert(
        editingVariantId !== null
          ? "Variant updated successfully."
          : "Variant added successfully."
      );
    } catch (error) {
      console.error("Save variant error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save variant."
      );
    } finally {
      setVariantSaving(false);
    }
  }

  function editVariant(variant: ProductVariant) {
    setVariantForm({
      color: variant.color || "",
      size: variant.size || "",
      model: variant.model || "",
      sku: variant.sku || "",
      price:
        variant.price !== undefined
          ? String(variant.price)
          : "",
      old_price:
        variant.old_price !== undefined
          ? String(variant.old_price)
          : "",
      stock: String(variant.stock ?? 0),
      images: variant.images || [],
      is_active: variant.is_active !== false,
    });

    setEditingVariantId(variant.id);
  }

  async function deleteVariant(variantId: number) {
    if (!window.confirm("Delete this variant?")) return;

    try {
      const response = await fetch(
        `/api/admin/products/${variantId}/variants`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to delete variant."
        );
      }

      if (editingId !== null) {
        await loadVariants(editingId);
      }

      if (editingVariantId === variantId) {
        resetVariantForm();
      }

      alert("Variant deleted successfully.");
    } catch (error) {
      console.error("Delete variant error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete variant."
      );
    }
  }

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setUploading(true);

    try {
      const { supabase } = await import("@/lib/supabase");
      const uploadedImages: string[] = [];

      for (const file of files.slice(0, 20)) {
        const extension = file.name.split(".").pop() || "jpg";

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Image upload failed:", error);
          continue;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        uploadedImages.push(data.publicUrl);
      }

      if (!uploadedImages.length) {
        alert("No images were uploaded.");
        return;
      }

      setForm((current) => ({
        ...current,
        image: uploadedImages[0],
        images: uploadedImages,
      }));

      console.log("TOTAL UPLOADED:", uploadedImages.length);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload images.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.price || !form.stock) {
      alert("Please enter Product Name, Price and Stock.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      name_sw: form.name_sw.trim(),
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
      category: form.category,
      category_sw: form.category_sw.trim(),
      stock: Number(form.stock),
      cost_price: Number(form.cost_price || 0),
      description: form.description.trim(),
      description_sw: form.description_sw.trim(),
      image: form.image,
      images: form.images,
      colors: form.colors,
      sizes: form.sizes,
      sizePrices: Object.fromEntries(
        form.sizes
          .map((size) => [size, form.sizePrices[size] ?? ""])
          .filter(([, price]) => String(price).trim() !== "")
          .map(([size, price]) => [size, Number(price)])
          .filter(
            ([, price]) =>
              Number.isFinite(Number(price)) && Number(price) >= 0
          )
      ),
      storageOptions: form.storageOptions.map((item) => ({
        storage: item.storage.trim(),
        price: Number(item.price),
        stock: Number(item.stock),
      })),
      discount: Number(form.discount || 0),
    };

    try {
      const endpoint =
        editingId !== null
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products";

      const method = editingId !== null ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            (editingId !== null
              ? "Failed to update product."
              : "Failed to save product.")
        );
      }

      alert(
        editingId !== null
          ? "Product updated successfully!"
          : "Product saved successfully!"
      );

      await loadProducts();
      setForm(emptyForm);
      setEditingId(null);
      setVariants([]);
      resetVariantForm();
      setShowForm(false);
    } catch (error) {
      console.error("Product save error:", error);

      alert(
        error instanceof Error
          ? error.message
          : editingId !== null
            ? "Failed to update product."
            : "Failed to save product."
      );
    }
  }

  function handleEditProduct(product: Product) {
    setForm({
      name: product.name || "",
      name_sw: product.name_sw || "",
      price: String(product.price ?? ""),
      oldPrice: String(product.oldPrice ?? ""),
      category: product.category || "Women's Fashion",
      category_sw: product.category_sw || "",
      stock: String(product.stock ?? ""),
      cost_price: String(product.cost_price ?? 0),
      description: product.description || "",
      description_sw: product.description_sw || "",
      image: product.image || "",
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      sizePrices: Object.fromEntries(
        Object.entries(product.sizePrices || {}).map(([size, price]) => [
          size,
          String(price ?? ""),
        ])
      ),
      storageOptions: (product.storageOptions || []).map((item) => ({
        storage: item.storage || "",
        price: String(item.price ?? ""),
        stock: String(item.stock ?? ""),
      })),
      discount: Number(product.discount || 0),
    });

    setEditingId(product.id);
    setShowForm(true);

    resetVariantForm();
    setVariants([]);
    void loadVariants(product.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDeleteProduct(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(id);
      await loadProducts();
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product.");
    }
  }

  const filteredProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);
    const query = search.trim().toLowerCase();

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && stock > 0 && stock <= 5) ||
      (stockFilter === "out" && stock === 0);

    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    return matchesStock && matchesSearch;
  });

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.stock || 0) === 0
  ).length;

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
          <div>
            <a
              href="/admin"
              className="text-sm font-bold text-orange-600 hover:underline"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-2 text-2xl font-black text-gray-900">
              Product Management
            </h1>

            <p className="text-sm text-gray-500">
              Add and manage GAMORA ONLINE products
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setForm(emptyForm);
                setEditingId(null);
                setVariants([]);
                resetVariantForm();
              } else {
                setVariants([]);
                resetVariantForm();
              }

              setShowForm(!showForm);
            }}
            className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700"
          >
            {showForm ? "Close" : "+ Add Product"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`w-full rounded-xl bg-white p-5 text-left shadow-sm transition hover:ring-2 hover:ring-orange-300 ${
              stockFilter === "all" ? "ring-2 ring-orange-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="mt-2 text-3xl font-black">{products.length}</p>
          </button>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Stock</p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {totalStock}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStockFilter("low")}
            className={`w-full rounded-xl bg-white p-5 text-left shadow-sm transition hover:ring-2 hover:ring-yellow-300 ${
              stockFilter === "low" ? "ring-2 ring-yellow-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {lowStock}
            </p>
            <p className="mt-1 text-xs text-gray-500">5 units or less</p>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("out")}
            className={`w-full rounded-xl bg-white p-5 text-left shadow-sm transition hover:ring-2 hover:ring-red-300 ${
              stockFilter === "out" ? "ring-2 ring-red-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {outOfStock}
            </p>
          </button>
        </div>

        {showForm && (
          <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-black">
              {editingId !== null ? "Edit Product" : "Add New Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Product Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Men's Jeans"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Product Name (Swahili)
                </label>

                <input
                  name="name_sw"
                  value={form.name_sw}
                  onChange={handleChange}
                  placeholder="Mfano: Jeans za Wanaume"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border px-4 py-3"
                >
                  <option>Women's Fashion</option>
                  <option>Men's Fashion</option>
                  <option>Shoes</option>
                  <option>Home & Kitchen</option>
                  <option>Electronics</option>
                  <option>Beauty</option>
                  <option>Accessories</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category (Swahili)
                </label>

                <input
                  name="category_sw"
                  value={form.category_sw}
                  onChange={handleChange}
                  placeholder="Mfano: Mitindo ya Wanaume"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Selling Price (TZS) *
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  placeholder="50000"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Old Price (TZS)
                </label>

                <input
                  type="number"
                  name="oldPrice"
                  value={form.oldPrice}
                  onChange={handleChange}
                  min="0"
                  placeholder="65000"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Discount (%)
                </label>

                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="10"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Cost Price (TZS)
                </label>

                <input
                  type="number"
                  name="cost_price"
                  value={form.cost_price}
                  onChange={handleChange}
                  min="0"
                  placeholder="40000"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Product Images
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImage}
                  disabled={uploading}
                  className="w-full rounded-lg border bg-white px-4 py-3"
                />

                {uploading && (
                  <p className="mt-2 text-sm font-bold text-orange-600">
                    Uploading images...
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Colors
                </label>

                <input
                  type="text"
                  value={form.colors.join(", ")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      colors: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Black, Red, Blue"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Sizes
                </label>

                <input
                  type="text"
                  value={form.sizes.join(", ")}
                  onChange={(event) => {
                    const sizes = event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);

                    setForm((current) => ({
                      ...current,
                      sizes,
                      sizePrices: Object.fromEntries(
                        sizes.map((size) => [
                          size,
                          current.sizePrices[size] ?? "",
                        ])
                      ),
                    }));
                  }}
                  placeholder="S, M, L, XL or 1L, 2L, 3L or 29, 30, 31"
                  className="w-full rounded-lg border px-4 py-3"
                />

                {form.sizes.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[1fr_1fr] bg-slate-50 text-sm font-bold text-slate-700">
                      <div className="border-r border-slate-200 px-4 py-3">
                        Size
                      </div>
                      <div className="px-4 py-3">
                        Optional Price
                      </div>
                    </div>

                    {form.sizes.map((size) => (
                      <div
                        key={size}
                        className="grid grid-cols-[1fr_1fr] border-t border-slate-200"
                      >
                        <div className="flex items-center border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          {size}
                        </div>

                        <div className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={form.sizePrices[size] ?? ""}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                sizePrices: {
                                  ...current.sizePrices,
                                  [size]: event.target.value,
                                },
                              }))
                            }
                            placeholder="Leave blank to use main price"
                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {form.sizes.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Leave a size price blank to use the main product price.
                  </p>
                )}
              </div>

              {editingId !== null && (
                <div className="md:col-span-2 rounded-xl border-2 border-orange-100 bg-orange-50/40 p-5">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">
                        Product Variants
                      </h3>
                      <p className="text-xs text-gray-500">
                        Set different prices, stock and SKU for each size,
                        color or model.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => resetVariantForm()}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm ring-1 ring-orange-200"
                    >
                      + New Variant
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <input
                      value={variantForm.color}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          color: event.target.value,
                        }))
                      }
                      placeholder="Color e.g. Black"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      value={variantForm.size}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          size: event.target.value,
                        }))
                      }
                      placeholder="Size e.g. M / 128GB"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      value={variantForm.model}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                      placeholder="Model e.g. iPhone 15"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      value={variantForm.sku}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          sku: event.target.value,
                        }))
                      }
                      placeholder="SKU *"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      type="number"
                      min="0"
                      value={variantForm.price}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      placeholder="Selling Price"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      type="number"
                      min="0"
                      value={variantForm.old_price}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          old_price: event.target.value,
                        }))
                      }
                      placeholder="Old Price"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <input
                      type="number"
                      min="0"
                      value={variantForm.stock}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          stock: event.target.value,
                        }))
                      }
                      placeholder="Stock"
                      className="rounded-lg border bg-white px-3 py-2.5"
                    />

                    <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={variantForm.is_active}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            is_active: event.target.checked,
                          }))
                        }
                      />
                      Active Variant
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveVariant}
                      disabled={variantSaving}
                      className="rounded-lg bg-orange-600 px-5 py-2.5 font-black text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {variantSaving
                        ? "Saving..."
                        : editingVariantId !== null
                          ? "Update Variant"
                          : "Add Variant"}
                    </button>

                    {editingVariantId !== null && (
                      <button
                        type="button"
                        onClick={resetVariantForm}
                        className="rounded-lg bg-white px-5 py-2.5 font-bold text-gray-700 ring-1 ring-gray-300"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
                    {variantLoading ? (
                      <p className="p-5 text-sm font-bold text-gray-500">
                        Loading variants...
                      </p>
                    ) : variants.length === 0 ? (
                      <p className="p-5 text-sm text-gray-500">
                        No variants yet. Add the first variant above.
                      </p>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                          <tr>
                            <th className="px-3 py-3 font-bold">Color</th>
                            <th className="px-3 py-3 font-bold">Size</th>
                            <th className="px-3 py-3 font-bold">Model</th>
                            <th className="px-3 py-3 font-bold">SKU</th>
                            <th className="px-3 py-3 font-bold">Price</th>
                            <th className="px-3 py-3 font-bold">Stock</th>
                            <th className="px-3 py-3 font-bold">Status</th>
                            <th className="px-3 py-3 font-bold">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {variants.map((variant) => (
                            <tr
                              key={variant.id}
                              className="border-t"
                            >
                              <td className="px-3 py-3">
                                {variant.color || "—"}
                              </td>
                              <td className="px-3 py-3">
                                {variant.size || "—"}
                              </td>
                              <td className="px-3 py-3">
                                {variant.model || "—"}
                              </td>
                              <td className="px-3 py-3 font-mono text-xs">
                                {variant.sku}
                              </td>
                              <td className="px-3 py-3 font-bold">
                                {variant.price !== undefined
                                  ? `TZS ${Number(
                                      variant.price
                                    ).toLocaleString()}`
                                  : "—"}
                              </td>
                              <td className="px-3 py-3 font-bold">
                                {variant.stock}
                              </td>
                              <td className="px-3 py-3">
                                {variant.is_active ? (
                                  <span className="font-bold text-green-600">
                                    Active
                                  </span>
                                ) : (
                                  <span className="font-bold text-gray-400">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      editVariant(variant)
                                    }
                                    className="rounded-md bg-orange-50 px-3 py-1.5 font-bold text-orange-700"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteVariant(variant.id)
                                    }
                                    className="rounded-md bg-red-50 px-3 py-1.5 font-bold text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder={`Describe your product...

Optional structure:

features
Petrol engine
Bush cutter design
Easy to operate

specifications
Model: 56272727
Engine Type: Petrol
Weight: 7 kg`}
                  className="w-full rounded-lg border px-4 py-3"
                />

                <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500">
                  <p className="font-bold text-gray-700">
                    Automatic Features & Specifications
                  </p>

                  <p className="mt-1">
                    Write your normal English description. If you want
                    Features or Specifications, add the corresponding heading
                    and list the items below it. You can use either section
                    alone or both.
                  </p>

                  <p className="mt-2">
                    Example: <strong>Model: 56272727</strong>,{" "}
                    <strong>Model - 56272727</strong>, or{" "}
                    <strong>Model 56272727</strong>.
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Description (Swahili)
                </label>

                <textarea
                  name="description_sw"
                  value={form.description_sw}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Eleza bidhaa hii kwa Kiswahili..."
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              {form.images.length > 0 && (
                <div className="md:col-span-2">
                  <p className="mb-3 text-sm font-bold">Image Preview</p>

                  <div className="flex flex-wrap gap-3">
                    {form.images.map((img, index) => (
                      <img
                        key={`${img}-${index}`}
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="h-28 w-28 rounded-lg border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-orange-600 px-6 py-3 font-black text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {editingId !== null ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Your Products</h2>

              <p className="text-sm text-gray-500">
                {filteredProducts.length} products
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border px-4 py-3 md:max-w-sm"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl bg-gray-50 py-16 text-center">
              <div className="text-6xl">🛍️</div>

              <p className="mt-4 font-bold text-gray-500">
                No products found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-xl border bg-white"
                >
                  <div className="flex h-48 items-center justify-center bg-gray-50">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">🛍️</span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-bold text-orange-600">
                      {product.category}
                    </p>

                    <h3 className="mt-1 line-clamp-2 font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-2 font-black text-orange-600">
                      TZS {Number(product.price).toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-500">
                      Stock: {Number(product.stock || 0)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="rounded-lg bg-orange-50 py-2 font-bold text-orange-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg bg-red-50 py-2 font-bold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
