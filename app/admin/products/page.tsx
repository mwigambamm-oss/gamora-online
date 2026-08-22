"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Product,
  getProducts,
  saveProduct,
  deleteProduct,
} from "@/lib/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    category: "Women's Fashion",
    stock: "",
    description: "",
    image: "",
  });

  async function loadProducts() {
    const data = await getProducts();
    setProducts(data);
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

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setForm((current) => ({
      ...current,
      image: imageUrl,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.price || !form.stock) {
      alert("Please enter Product Name, Price and Stock.");
      return;
    }

    try {
      await saveProduct({
        name: form.name,
        price: Number(form.price),
        oldPrice: Number(form.oldPrice || form.price),
        category: form.category,
        stock: Number(form.stock),
        description: form.description,
        image: form.image,
      });

      await loadProducts();

      alert("Product saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save product. Please try again.");
      return;
    }

    setForm({
      name: "",
      price: "",
      oldPrice: "",
      category: "Women's Fashion",
      stock: "",
      description: "",
      image: "",
    });

    setShowForm(false);
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to delete product. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="border-b bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <div>

            <a
              href="/admin"
              className="text-sm font-bold text-orange-600"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-2 text-2xl font-black">
              Product Management
            </h1>

            <p className="text-sm text-gray-500">
              Add and manage GAMORA ONLINE products
            </p>

          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700"
          >
            {showForm ? "Close" : "+ Add Product"}
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ADD PRODUCT FORM */}

        {showForm && (

          <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-black">
              Add New Product
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-2"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Product Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Men's Jeans"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-orange-500"
                />

              </div>

              {/* CATEGORY */}

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

              {/* PRICE */}

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Selling Price (TZS) *
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  className="w-full rounded-lg border px-4 py-3"
                />

              </div>

              {/* OLD PRICE */}

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Old Price (TZS)
                </label>

                <input
                  type="number"
                  name="oldPrice"
                  value={form.oldPrice}
                  onChange={handleChange}
                  placeholder="65000"
                  min="0"
                  className="w-full rounded-lg border px-4 py-3"
                />

              </div>

              {/* STOCK */}

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="10"
                  min="0"
                  className="w-full rounded-lg border px-4 py-3"
                />

              </div>

              {/* IMAGE */}

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Product Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="w-full rounded-lg border bg-white px-4 py-3"
                />

              </div>

              {/* DESCRIPTION */}

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

              {/* IMAGE PREVIEW */}

              {form.image && (

                <div className="md:col-span-2">

                  <p className="mb-2 text-sm font-bold">
                    Image Preview
                  </p>

                  <img
                    src={form.image}
                    alt="Product preview"
                    className="h-40 w-40 rounded-lg object-cover"
                  />

                </div>

              )}

              {/* SAVE */}

              <div className="md:col-span-2">

                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-8 py-3 font-bold text-white hover:bg-orange-700"
                >
                  Save Product
                </button>

              </div>

            </form>

          </section>

        )}

        {/* PRODUCTS */}

        <section className="rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-black">
              Your Products
            </h2>

            <p className="text-sm text-gray-500">
              {products.length} products
            </p>

          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {products.map((product) => (

              <article
                key={product.id}
                className="overflow-hidden rounded-xl border bg-white"
              >

                <div className="flex h-48 items-center justify-center bg-gray-100">

                  {product.image ? (

                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <span className="text-6xl">
                      🛍️
                    </span>

                  )}

                </div>

                <div className="p-4">

                  <p className="text-xs font-bold text-orange-600">
                    {product.category}
                  </p>

                  <h3 className="mt-1 font-bold">
                    {product.name}
                  </h3>

                  <p className="mt-2 font-black text-orange-600">
                    TZS {product.price.toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </p>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="mt-4 w-full rounded-lg bg-red-50 py-2 font-bold text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>

                </div>

              </article>

            ))}

          </div>

        </section>

      </div>

    </main>
  );
}
