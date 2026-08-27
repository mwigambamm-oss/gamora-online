"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Product,
  getProducts,
  saveProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const emptyForm = {
    name: "",
    price: "",
    oldPrice: "",
    category: "Women's Fashion",
    stock: "",
    cost_price: "",
    description: "",
    image: "",
    images: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    discount: 0,
  };

  const [form, setForm] = useState(emptyForm);

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
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
      category: form.category,
      stock: Number(form.stock),
      cost_price: Number(form.cost_price || 0),
      description: form.description.trim(),
      image: form.image,
      images: form.images,
      colors: form.colors,
      sizes: form.sizes,
      discount: Number(form.discount || 0),
    };

    try {
      if (editingId !== null) {
        await updateProduct(editingId, productData);
        alert("Product updated successfully!");
      } else {
        await saveProduct(productData);
        alert("Product saved successfully!");
      }

      await loadProducts();
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Product save error:", error);
      alert(
        editingId !== null
          ? "Failed to update product."
          : "Failed to save product."
      );
    }
  }

  function handleEditProduct(product: Product) {
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      oldPrice: String(product.oldPrice ?? ""),
      category: product.category || "Women's Fashion",
      stock: String(product.stock ?? ""),
      cost_price: String(product.cost_price ?? 0),
      description: product.description || "",
      image: product.image || "",
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      discount: Number(product.discount || 0),
    });

    setEditingId(product.id);
    setShowForm(true);

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
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
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
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="mt-2 text-3xl font-black">{products.length}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Stock</p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {totalStock}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="mt-2 text-3xl font-black text-yellow-600">
              {lowStock}
            </p>
            <p className="mt-1 text-xs text-gray-500">5 units or less</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {outOfStock}
            </p>
          </div>
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sizes: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="S, M, L, XL"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your product..."
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
