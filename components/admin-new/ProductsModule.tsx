"use client";

import { useState } from "react";
import ProductImageUploader from "./product/ProductImageUploader";

export default function ProductsModule() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Draft");


  async function saveProduct() {
    try {
      setSaving(true);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category,
          stock: Number(stock),
          images: [],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed");
      }

      alert("✅ Product saved successfully");

    } catch (error:any) {
      alert(error.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  function handleImages(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    const combined = [...images, ...selected].slice(0, 20);

    setImages(combined);

    setPreviews(
      combined.map((file) => URL.createObjectURL(file))
    );
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);

    setImages(newImages);

    setPreviews(
      newImages.map((file) => URL.createObjectURL(file))
    );
  }

  return (
    <section className="space-y-6">

      <ProductImageUploader
        onChange={(files) => {
          setImages(files);
          setPreviews(files.map((file) => URL.createObjectURL(file)));
          setPrimaryImage(0);
        }}
      />

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#800020]">
          GAMORA ONLINE
        </p>

        <h2 className="text-3xl font-black text-[#3F3437]">
          Add Product
        </h2>
      </div>


      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h3 className="mb-4 text-xl font-black">
          Product Information
        </h3>


        <div className="grid gap-4 md:grid-cols-2">

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />


          <input
            placeholder="SKU"
            className="rounded-xl border px-4 py-3"
          />


          <input
            placeholder="Brand"
            className="rounded-xl border px-4 py-3"
          />


          <select className="rounded-xl border px-4 py-3">

            <option>
              Active
            </option>

            <option>
              Draft
            </option>

            <option>
              Out of Stock
            </option>

            <option>
              Archived
            </option>

          </select>

        </div>

      </div>



      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h3 className="mb-4 text-xl font-black">
          Product Images
        </h3>


        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 hover:bg-slate-50">

          <div className="text-4xl">
            📷
          </div>


          <p className="mt-2 font-bold">
            Upload Product Images
          </p>


          <p className="text-sm text-slate-500">
            JPG PNG WEBP — Maximum 20 images
          </p>


          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e)=>handleImages(e.target.files)}
          />

        </label>



        <div className="mt-5 text-sm font-bold">
          {images.length} / 20 images
        </div>



        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">

          {previews.map((src,index)=>(

            <div
              key={src}
              className="relative overflow-hidden rounded-xl border"
            >

              <img
                src={src}
                className="h-32 w-full object-cover"
              />


              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-[#800020] px-2 py-1 text-xs font-bold text-white">
                  ⭐ Main
                </span>
              )}


              <button
                onClick={()=>removeImage(index)}
                className="absolute right-2 top-2 rounded-full bg-red-600 px-2 text-white"
              >
                ✕
              </button>

            </div>

          ))}

        </div>


      </div>




      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h3 className="text-xl font-black">
          Pricing
        </h3>


        <div className="mt-4 grid gap-4 md:grid-cols-3">

          <input
            placeholder="Cost Price"
            type="number"
            className="rounded-xl border px-4 py-3"
          />


          <input
            placeholder="Selling Price"
            type="number"
            className="rounded-xl border px-4 py-3"
          />


          <input
            placeholder="Discount"
            type="number"
            className="rounded-xl border px-4 py-3"
          />

        </div>

      </div>




      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h3 className="text-xl font-black">
          Description
        </h3>


        <textarea
          placeholder="Full product description"
          className="mt-4 min-h-40 w-full rounded-xl border p-4"
        />

      </div>




      <div className="flex gap-3">

        <button className="rounded-xl border px-6 py-3 font-bold">
          Save Draft
        </button>


        <button className="rounded-xl bg-[#800020] px-6 py-3 font-bold text-white">
          Publish Product
        </button>

      </div>


      
      <select
        value={status}
        onChange={(e)=>setStatus(e.target.value)}
        className="rounded-xl border px-4 py-3"
      >
        <option value="Draft">Save Draft</option>
        <option value="Active">Publish Product</option>
        <option value="Out of Stock">Out of Stock</option>
        <option value="Archived">Archived</option>
      </select>

<button
        type="button"
        onClick={saveProduct}
        disabled={saving}
        className="rounded-xl bg-[#800020] px-6 py-3 font-black text-white hover:bg-[#6b001b] disabled:bg-slate-300"
      >
        {saving ? "Saving..." : "🚀 Save Product"}
      </button>

    </section>
  );
}
