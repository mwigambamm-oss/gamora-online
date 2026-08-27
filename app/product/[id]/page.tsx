"use client";

import { getProductById, getProducts } from "@/lib/products";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  description?: string;
  image?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  discount?: number;
  orders_count?: number;
  rating?: number;
};

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
const [selectedImage, setSelectedImage] = useState("");
const [liked, setLiked] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const id = params.id;
        const productId = Number(id);

        const found = await getProductById(productId);

        setProduct(found);

        if (found) {
          const allProducts = await getProducts();

          const related = allProducts
            .filter(
              (item) =>
                item.id !== productId &&
                item.category === found.category
            )
            .slice(0, 4);

          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadProduct();
    }
  }, [params?.id]);

  function addToCart() {
    if (!product || product.stock <= 0) return;

    const savedCart = localStorage.getItem("gamora_cart");

    let cart: (Product & { quantity: number })[] = [];

    try {
      cart = savedCart ? JSON.parse(savedCart) : [];
    } catch {
      cart = [];
    }

    const existing = cart.find(
      (item) => item.id === product.id
    );

    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + quantity,
        product.stock
      );
    } else {
      cart.push({
        ...product,
        quantity,
      });
    }

    localStorage.setItem(
      "gamora_cart",
      JSON.stringify(cart)
    );

    alert("Product added to cart!");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">
          Loading product...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="text-7xl">🔎</div>

        <h1 className="mt-5 text-2xl font-black">
          Product Not Found
        </h1>

        <p className="mt-2 text-slate-500">
          This product may have been removed.
        </p>

        <a
          href="/"
          className="mt-6 rounded-xl bg-sky-700 px-6 py-3 font-black text-white"
        >
          ← Back to Shop
        </a>
      </main>
    );
  }

  const discount =
    product.oldPrice &&
    product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  const total = product.price * quantity;

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

<a href="/" className="flex items-center">
  <img
    src="/gamora-logo.png"
    alt="Gamora Online"
    className="h-14 w-auto object-contain"
  />
</a>
          <a
            href="/cart"
            className="rounded-lg px-4 py-2 font-bold text-sky-700 hover:bg-sky-50"
          >
            🛒 Cart
          </a>

        </div>
      </header>

      {/* PRODUCT */}

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-14">

        <a
          href="/"
          className="mb-6 inline-block font-bold text-sky-700"
        >
          ← Back to Shop
        </a>

        <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm md:grid-cols-2">

          {/* IMAGE */}

          <div className="relative flex min-h-[350px] items-center justify-center bg-slate-50 md:min-h-[600px]">

            {(product.images && product.images.length > 0) ? (
  <img
  src={
    selectedImage ||
    product.images?.[0] ||
    product.image ||
    ""
  }
  alt={product.name}
  className="h-full max-h-[600px] w-full object-contain"
/>
) : (
  <div className="text-9xl">
    🛍️
  </div>
)}

            {discount > 0 && (
              <span className="absolute left-5 top-5 rounded-full bg-red-500 px-4 py-2 font-black text-white shadow">
                -{discount}%
              </span>
            )}

                    </div>

          {/* IMAGE THUMBNAILS */}

          <div className="flex gap-3 p-4">

            {(product.images && product.images.length > 0
              ? product.images
              : product.image
              ? [product.image]
              : []
            ).map((img, index) => (
              <img
  key={index}
  src={img}
  alt={product.name}
  onClick={() => setSelectedImage(img)}
  className="h-20 w-20 cursor-pointer rounded-lg object-cover border"
/>
            ))}

          </div>


          {/* DETAILS */}

          <div className="p-6 md:p-10">

            <p className="text-sm font-black uppercase tracking-wide text-sky-600">
              {product.category}
            </p>

            <h1 className="mt-3 text-xl font-bold text-slate-900 md:text-2xl">
              {product.name}
                        </h1>


            {/* LIKE & SHARE */}

            <div className="mt-4 flex gap-3">

              <button
                onClick={() => setLiked(!liked)}
                className="rounded-xl border px-5 py-2 font-bold hover:bg-slate-50"
              >
                {liked ? "❤️ Liked" : "🤍 Like"}
              </button>


              <button
  onClick={() => {
  const url = encodeURIComponent(window.location.href);

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "_blank",
    "width=600,height=500"
  );
}}
  className="rounded-xl border px-5 py-2 font-bold"
>
  🔗 Share
</button>

            </div>


            <div className="mt-5 flex items-center gap-2">
              <span className="text-lg">⭐⭐⭐⭐⭐</span>
              <span className="text-sm text-slate-400">
                New Product
              </span>
            </div>

            {/* PRICE */}

            <div className="mt-6 flex flex-wrap items-center gap-3">

              <span className="text-2xl font-bold text-sky-700">
                TZS {product.price.toLocaleString()}
              </span>

              {product.oldPrice &&
                product.oldPrice > product.price && (
                  <span className="text-lg text-slate-400 line-through">
                    TZS {product.oldPrice.toLocaleString()}
                  </span>
                )}

            </div>


{/* PRODUCT STATS */}

<div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">

  {product.discount && product.discount > 0 && (
    <span className="text-red-600">
      -{product.discount}% OFF
    </span>
  )}

  <span className="text-slate-600">
    🛒 {product.orders_count || 0} Orders
  </span>

  <span className="text-yellow-500">
    ⭐ {product.rating || 0} Rating
  </span>

</div>


{/* STOCK */}

            <div className="mt-5">

              {product.stock > 5 ? (
                <p className="font-bold text-green-600">
                  ✓ In Stock ({product.stock} available)
                </p>
              ) : product.stock > 0 ? (
                <p className="font-bold text-orange-600">
                  ⚠ Only {product.stock} left
                </p>
              ) : (
                <p className="font-bold text-red-600">
                  ✕ Out of Stock
                </p>
              )}

            </div>

            {/* DESCRIPTION */}

            <div className="mt-7 border-t pt-6">

              <h2 className="font-black">
                Description
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                {product.description ||
                  "Quality product available at GAMORA ONLINE."}
              </p>

                        </div>


            {/* COLORS */}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-7">

                <p className="mb-2 text-sm font-bold">
                  Color
                </p>

                <div className="flex flex-wrap gap-2">

                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-lg border px-4 py-2 text-sm font-bold"
                    >
                      {color}
                    </span>
                  ))}

                </div>

              </div>
            )}


            {/* SIZES */}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">

                <p className="mb-2 text-sm font-bold">
                  Size
                </p>

                <div className="flex flex-wrap gap-2">

                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-lg border px-4 py-2 text-sm font-bold"
                    >
                      {size}
                    </span>
                  ))}

                </div>

              </div>
            )}


            {/* QUANTITY */}

            {product.stock > 0 && (
              <div className="mt-7">

                <p className="mb-2 text-sm font-bold">
                  Quantity
                </p>

                <div className="flex w-fit items-center overflow-hidden rounded-xl border">

                  <button
                    onClick={() =>
                      setQuantity((q) => Math.max(1, q - 1))
                    }
                    className="px-5 py-3 text-xl font-black hover:bg-slate-50"
                  >
                    −
                  </button>

                  <span className="min-w-12 text-center font-black">
                    {quantity}
                  </span>

                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stock, q + 1)
                      )
                    }
                    className="px-5 py-3 text-xl font-black hover:bg-slate-50"
                  >
                    +
                  </button>

                </div>

              </div>
            )}

            {/* TOTAL */}

            {product.stock > 0 && (
              <div className="mt-6 rounded-2xl bg-sky-50 p-5">

                <div className="flex items-center justify-between">

                  <span className="font-bold text-slate-600">
                    Total
                  </span>

                  <span className="text-2xl font-black text-sky-700">
                    TZS {total.toLocaleString()}
                  </span>

                </div>

              </div>
            )}

            {/* ADD TO CART */}

            <button
              onClick={addToCart}
              disabled={product.stock <= 0}
              className="mt-6 w-full rounded-xl bg-sky-700 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-sky-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {product.stock > 0
                ? "🛒 Add to Cart"
                : "Out of Stock"}
            </button>

            {product.stock > 0 && (
              <button
                onClick={() => {
                  addToCart();
                  window.location.href = "/checkout";
                }}
                className="mt-3 w-full rounded-xl border-2 border-sky-700 bg-white px-6 py-4 text-lg font-black text-sky-700 transition hover:bg-sky-50 active:scale-[0.98]"
              >
                ⚡ Buy Now
              </button>
            )}

            <a
              href={`https://wa.me/255798555221?text=${encodeURIComponent(
                `Hello GAMORA ONLINE, I am interested in ${product.name} - TZS ${product.price.toLocaleString()}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-4 text-lg font-black text-white shadow-md transition hover:bg-green-700 active:scale-[0.98]"
            >
              💬 Ask on WhatsApp
            </a>

            {/* TRUST & DELIVERY */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl">🚚</div>
                <p className="mt-2 font-black text-slate-900">
                  Fast Delivery
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Delivery available in Dar es Salaam and other locations.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl">🔒</div>
                <p className="mt-2 font-black text-slate-900">
                  Secure Shopping
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Your order information is handled securely.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl">✅</div>
                <p className="mt-2 font-black text-slate-900">
                  Quality Products
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Shop confidently from GAMORA ONLINE.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-2xl">💬</div>
                <p className="mt-2 font-black text-slate-900">
                  Customer Support
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Need help? Contact us directly on WhatsApp.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* RELATED PRODUCTS */}

      {relatedProducts.length > 0 && (
        <section className="border-t bg-white py-14">
          <div className="mx-auto max-w-7xl px-4">

            <div className="mb-8">
              <p className="font-black uppercase tracking-wide text-sky-600">
                GAMORA ONLINE
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                You May Also Like
              </h2>

              <p className="mt-2 text-slate-500">
                Discover more products in this category.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">

              {relatedProducts.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  <a
                    href={`/product/${item.id}`}
                    className="block"
                  >

                    <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-50">

                      {(item.images && item.images.length > 0) || item.image ? (
  <img
    src={
      item.images?.[0] ||
      item.image ||
      ""
    }
    alt={item.name}
    loading="lazy"
    className="h-full w-full object-cover transition duration-500 hover:scale-105"
  />
) : (
                        <div className="text-6xl">
                          🛍️
                        </div>
                      )}

                    </div>

                    <div className="p-4">

                      <p className="text-[10px] font-black uppercase text-sky-600">
                        {item.category}
                      </p>

                      <h3 className="mt-2 line-clamp-2 min-h-12 font-black text-slate-900">
                        {item.name}
                      </h3>

                      <p className="mt-3 text-lg font-black text-sky-700">
                        TZS {item.price.toLocaleString()}
                      </p>

                      <span className="mt-4 block rounded-xl bg-sky-700 px-4 py-3 text-center text-sm font-black text-white">
                        View Product
                      </span>

                    </div>

                  </a>

                </article>
              ))}

            </div>

          </div>
        </section>
      )}

    </main>
  );
}
