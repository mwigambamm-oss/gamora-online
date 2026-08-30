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
    category: "",
    stock: "",
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


    setForm({
      ...form,
      images:[
        ...form.images,
        ...uploaded
      ],
      image:
        form.image ||
        uploaded[0] ||
        "",
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

      name:form.name,

      price:Number(form.price),

      oldPrice:
        Number(
          form.oldPrice ||
          form.price
        ),

      category:form.category,

      stock:Number(form.stock),

      description:
        form.description,

      image:
        form.image,

      images:
        form.images,

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

      category:
        product.category,

      stock:
        String(product.stock),

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
          className="bg-white rounded shadow p-5 space-y-4 mb-8"
        >

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product name"
            className="border p-3 rounded w-full"
          />


          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="border p-3 rounded w-full"
          />


          <input
            name="oldPrice"
            value={form.oldPrice}
            onChange={handleChange}
            placeholder="Old price"
            className="border p-3 rounded w-full"
          />


          <div className="flex gap-2">

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



          <input
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            className="border p-3 rounded w-full"
          />



          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Product description"
            rows={6}
            className="border p-3 rounded w-full resize-none"
          />



<ProductImageUploader
  initialImages={form.images}
  onMainChange={(url) =>
    setForm((current) => ({
      ...current,
      image: url,
    }))
  }
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

      if (!error) {
        const { data } =
          supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

        uploaded.push(data.publicUrl);
      }
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
            <p>
              Uploading images...
            </p>
          )}






          <button
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >

            {editingId
            ?"Update Product"
            :"Save Product"}

          </button>


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

            <p>
              Price: {product.price}
            </p>

            <p>
              Stock: {product.stock}
            </p>

            <p>
              Category: {product.category}
            </p>

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
