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

  const [uploading, setUploading] = useState(false);


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



  async function handleSubmit(
    e:FormEvent
  ){

    e.preventDefault();


    if(
      !form.name ||
      !form.price ||
      !form.stock
    ){

      alert(
        "Product name, price and stock required"
      );

      return;

    }



    const product:any = {

      name: form.name,

      price: Number(form.price),

      oldPrice:
        Number(
          form.oldPrice ||
          form.price
        ),

      cost_price:
        Number(form.cost_price || 0),

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

      description: form.description,

      image:
        form.images?.[0] ||
        form.image ||
        "",

      images: Array.isArray(form.images)
        ? form.images.filter(
            (url) =>
              typeof url === "string" &&
              url.startsWith("http")
          )
        : [],

    };



    try{


      if(editingId){

        await updateProduct(
          editingId,
          product
        );


        alert(
          "Product updated successfully"
        );


      }else{


        await saveProduct(
          product
        );

        alert(
          "Product saved successfully"
        );


      }



      setForm(emptyForm);

      setEditingId(null);

      setShowForm(false);

      loadProducts();



    }catch(error){

      console.error(error);

      alert(
        "Failed saving product"
      );

    }


  }




  function editProduct(
    product:Product
  ){

    setForm({

      name:
        product.name,

      price:
        String(product.price),

      oldPrice:
        String(product.oldPrice || ""),

      cost_price:
        String(product.cost_price ?? ""),

      category:
        product.category,

      stock:
        String(product.stock),

      colors:
        (product.colors || []).join(", "),

      sizes:
        (product.sizes || []).join(", "),

      description:
        product.description || "",

      image:
        product.image || "",

      images:
        product.images || [],

    });


    setEditingId(
      product.id
    );


    setShowForm(true);


    window.scrollTo({
      top:0,
      behavior:"smooth"
    });

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
    products.filter((p)=>
      p.name
      .toLowerCase()
      .includes(
        search.toLowerCase()
      )
    );


  return (
    <main className="p-6 bg-gray-100 min-h-screen">


      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Products Management
        </h1>


        <button
          onClick={()=>setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          Add Product
        </button>


      </div>

      {showForm && (

        <form
          onSubmit={handleSubmit}
          className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
        >

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
