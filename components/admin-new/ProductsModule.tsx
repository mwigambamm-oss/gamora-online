"use client";

import { useState } from "react";
import ProductImageUploader from "./product/ProductImageUploader";

export default function ProductsModule() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Draft");

  const discountPercentage =
    oldPrice && price
      ? Math.round(
          ((Number(oldPrice) - Number(price)) /
            Number(oldPrice)) *
            100
        )
      : 0;


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
        <p className="text-xs font-medium uppercase tracking-widest text-[#800020]">
          GAMORA ONLINE
        </p>

        <h2 className="text-xl font-medium text-[#3F3437]">
          Add Product
        </h2>
      </div>


      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <h3 className="mb-4 text-sm font-medium">
          Product Information
        </h3>


        <div className="grid gap-4 md:grid-cols-2">

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />


          <input
            placeholder="SKU"
            className="rounded-lg border px-3 py-2 text-sm"
          />


          <input
            placeholder="Brand"
            className="rounded-lg border px-3 py-2 text-sm"
          />


          <select className="rounded-lg border px-3 py-2 text-sm">

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



      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <h3 className="mb-4 text-sm font-medium">
          Product Images
        </h3>


        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 hover:bg-slate-50">

          <div className="text-4xl">
            📷
          </div>


          <p className="mt-2 font-normal">
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



        <div className="mt-5 text-sm font-normal">
          {images.length} / 20 images
        </div>



        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">

          {previews.map((src,index)=>(

            <div
              key={src}
              className="relative overflow-hidden rounded-xl border"
            >

              <img
                src={src}
                className="h-24 w-full object-cover sm:h-28"
              />


              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-[#800020] px-2 py-1 text-xs font-normal text-white">
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




      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <h3 className="text-sm font-medium">
          Pricing
        </h3>


        <div className="mt-4 grid gap-4 md:grid-cols-3">

          <input
            placeholder="Cost Price"
            type="number"
            className="rounded-lg border px-3 py-2 text-sm"
          />


          <input
            placeholder="Selling Price"
            type="number"
            className="rounded-lg border px-3 py-2 text-sm"
          />


          <input
            placeholder="Discount"
            type="number"
            className="rounded-lg border px-3 py-2 text-sm"
          />

        </div>

      </div>




      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <h3 className="text-sm font-medium">
          Description
        </h3>


        <textarea
          placeholder="Full product description"
          className="mt-4 min-h-40 w-full rounded-xl border p-4"
        />

      </div>




      <div className="flex gap-3">

        <button className="rounded-xl border px-6 py-3 font-normal">
          Save Draft
        </button>


        <button className="rounded-xl bg-[#800020] px-6 py-3 font-normal text-white">
          Publish Product
        </button>

      </div>


      
      <select
        value={status}
        onChange={(e)=>setStatus(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
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
        className="rounded-xl bg-[#800020] px-6 py-3 font-medium text-white hover:bg-[#6b001b] disabled:bg-slate-300"
      >
        {saving ? "Saving..." : "🚀 Save Product"}
      </button>

    </section>
  );
}
