"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById, getProducts } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import RelatedProducts from "@/components/product/RelatedProducts";
import { formatCurrency, type Currency } from "@/lib/currency";
import { normalizeProductDescription } from "@/lib/specifications";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Product = {
  id: number;
  name: string;
  name_sw?: string;
  price: number;
  oldPrice?: number;
  category?: string;
  category_sw?: string;
  stock: number;
  description?: string;
  description_sw?: string;
  image?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  orders_count?: number;
  likes?: number;
};

type Review = {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    console.log("GAMORA PRODUCT LANGUAGE:", language);
  }, [language]);
  const t = (en: string, sw: string) => (language === "sw" ? sw : en);

  const [product, setProduct] = useState<Product | null>(null);

  const displayName = product?.name;

  const displayCategory = product?.category;

  const parsedProduct = product
    ? normalizeProductDescription(product.description || "")
    : {
        description: "",
        key_features: [],
        specifications: {},
      };

  const displayDescription = parsedProduct.description;

  const displayKeyFeatures = parsedProduct.key_features;

  const displaySpecifications =
    Object.keys(parsedProduct.specifications).length > 0
      ? parsedProduct.specifications
      : {};

  const [related, setRelated] = useState<Product[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
const [cartCount, setCartCount] = useState(0);
  const [currency, setCurrency] = useState<Currency>("TZS");

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [likes, setLikes] = useState(200);
  const [orders, setOrders] = useState(300);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("gamora_currency");

    if (savedCurrency === "TZS" || savedCurrency === "USD") {
      setCurrency(savedCurrency);
    }
  }, []);

  /*
   * LOAD PRODUCT + REVIEWS
   */
  useEffect(() => {
    async function load() {
      const { id } = await params;
      const productId = Number(id);

      const item = await getProductById(productId);

console.log("GAMORA PRODUCT DATA:", item);

if (!item) {
  setProduct(null);
  return;
}

setProduct(item);

      // LOAD PERSISTENT LIKES + ORDERS
      try {
        const likeResponse = await fetch(
          `/api/products/${productId}/like`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (likeResponse.ok) {
          const likeData = await likeResponse.json();

          setLikes(
            Math.max(
              200,
              Number(likeData.likes || item.likes || 200)
            )
          );

          setOrders(
            Math.max(
              300,
              Number(
                likeData.orders ||
                  item.orders_count ||
                  300
              )
            )
          );

          setLiked(Boolean(likeData.liked));
        } else {
          setLikes(
            Math.max(200, Number(item.likes || 200))
          );

          setOrders(
            Math.max(
              300,
              Number(item.orders_count || 300)
            )
          );
        }
      } catch (error) {
        console.error(
          "Failed to load product social proof:",
          error
        );

        setLikes(
          Math.max(200, Number(item.likes || 200))
        );

        setOrders(
          Math.max(
            300,
            Number(item.orders_count || 300)
          )
        );
      }

      if (item.colors && item.colors.length > 0) {
        setSelectedColor(item.colors[0]);
      }

      if (item.sizes && item.sizes.length > 0) {
        setSelectedSize(item.sizes[0]);
      }

      const all = await getProducts();

      setRelated(
        all
          .filter(
            (p) =>
              p.id !== productId &&
              p.category === item.category
          )
          .slice(0, 5)
      );

      /*
       * LOAD REAL REVIEWS FROM SUPABASE
       */
      const { data: reviewData, error: reviewError } =
        await supabase
          .from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", {
            ascending: false,
          });

      setReviews(reviewData || []);
    }

    load();
  }, [params]);

  useEffect(() => {
  function updateCartCount() {
    try {
      const existing = localStorage.getItem("gamora_cart");
      const cart = existing ? JSON.parse(existing) : [];

      const count = cart.reduce(
        (total: number, item: { quantity?: number }) =>
          total + Number(item.quantity || 0),
        0
      );

      setCartCount(count);
    } catch (error) {
      console.error("Cart count error:", error);
      setCartCount(0);
    }
  }

  updateCartCount();

  window.addEventListener("cartUpdated", updateCartCount);

  return () => {
    window.removeEventListener("cartUpdated", updateCartCount);
  };
}, []);

  /*
   * PRODUCT IMAGES
   */
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  /*
   * AUTO SLIDE
   */
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveImage((current) =>
        current >= images.length - 1 ? 0 : current + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [product?.id, images.length]);

  /*
   * RESET IMAGE WHEN PRODUCT CHANGES
   */
  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  /*
   * NEXT IMAGE
   */
  function nextImage() {
    if (images.length <= 1) return;

    setActiveImage((current) =>
      current >= images.length - 1 ? 0 : current + 1
    );
  }

  /*
   * PREVIOUS IMAGE
   */
  function previousImage() {
    if (images.length <= 1) return;

    setActiveImage((current) =>
      current <= 0 ? images.length - 1 : current - 1
    );
  }

  /*
   * TOUCH / SWIPE
   */
  function handleTouchStart(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(null);
  }

  function handleTouchMove(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    setTouchEnd(e.touches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        nextImage();
      } else {
        previousImage();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }

  /*
   * SUBMIT REAL REVIEW
   */
  async function submitReview() {
    if (!product) return;

    const comment = reviewComment.trim();

    if (!comment) {
      alert("Please write your comment.");
      return;
    }

    setReviewLoading(true);

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: product.id,
        rating: reviewRating,
        comment,
      })
      .select()
      .single();

    setReviewLoading(false);

    if (error) {
      console.error("Review submit error:", error);
      alert("Failed to submit review. Please try again.");
      return;
    }

    if (data) {
      setReviews((current) => [data as Review, ...current]);
      setReviewComment("");
      setReviewRating(5);
    }
  }

  /*
   * ADD TO CART
   */
  function addToCart() {
    if (!product) return;

    const cartImage =
      product.images?.[0] ||
      product.image ||
      images[0] ||
      "";

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      image: cartImage,
      quantity: quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
    };

    try {
      const existing = localStorage.getItem("gamora_cart");
      const cart = existing ? JSON.parse(existing) : [];

      const existingIndex = cart.findIndex(
        (item: {
          id: number;
          color?: string;
          size?: string;
        }) =>
          item.id === product.id &&
          item.color === selectedColor &&
          item.size === selectedSize
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem(
        "gamora_cart",
        JSON.stringify(cart)
      );

window.dispatchEvent(new Event("cartUpdated"));

      alert("Product added to cart.");
    } catch (error) {
      console.error("Cart error:", error);
    }
  }

  function buyNow() {
    if (!product) return;

    const cartImage =
      product.images?.[0] ||
      product.image ||
      images[0] ||
      "";

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      image: cartImage,
      quantity: quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
    };

    try {
      localStorage.setItem(
        "gamora_cart",
        JSON.stringify([cartItem])
      );

      window.dispatchEvent(new Event("cartUpdated"));

      router.push("/checkout");

    } catch (error) {
      console.error("Buy now error:", error);
    }
  }


  /*
   * LOADING
   */
  if (!product) {
    return (
      <main className="min-h-screen bg-white p-5 text-center">
        <p className="text-sm font-normal text-slate-500">
          Loading...
        </p>
      </main>
    );
  }

  /*
   * ONLY SHOW 6 THUMBNAILS
   */
  const visibleThumbnails = images.slice(0, 6);

  /*
   * DISCOUNT
   */
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  /*
   * REAL REVIEW SUMMARY
   */
  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / reviewCount
        ).toFixed(1)
      : "0.0";

  async function loadLikeState(productId: number) {
    try {
      const response = await fetch(
        `/api/products/${productId}/like`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setLikes(Math.max(200, Number(data.likes || 200)));
      setOrders(Math.max(300, Number(data.orders || 300)));
      setLiked(Boolean(data.liked));
    } catch (error) {
      console.error("Failed to load like state:", error);
    }
  }

  async function toggleLike() {
    if (!product || likeLoading) return;

    setLikeLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/products/${product.id}/like`,
        {
          method: "POST",
          headers,
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        alert(
          t(
            "Please login to like this product.",
            "Tafadhali ingia kwenye account yako ili ku-like bidhaa hii."
          )
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update like");
      }

      setLiked(Boolean(data.liked));
      setLikes(Math.max(200, Number(data.likes || 200)));
      setOrders(Math.max(300, Number(data.orders || 300)));
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-3 pb-24 pt-4 sm:px-5 md:px-8 md:pb-10 md:pt-6">

      {/* ================= PRODUCT HERO ================= */}

      <section className="mx-auto w-full max-w-7xl">

        {/* BREADCRUMB */}

        <div className="mb-4 overflow-hidden whitespace-nowrap text-[11px] text-slate-400 sm:mb-5 sm:text-xs">
          <span>{t("Home", "Nyumbani")}</span>

          <span className="mx-2">›</span>

          <span>
            {displayCategory || t("Products", "Bidhaa")}
          </span>

          <span className="mx-2">›</span>

          <span className="text-slate-600">
            {displayName}
          </span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-10">

          {/* ================= IMAGE AREA ================= */}

          <div className="min-w-0">

            {/* MAIN IMAGE */}

            <div
              className="relative flex h-[300px] w-full items-center justify-center overflow-hidden bg-white sm:h-[390px] md:h-[500px] lg:h-[520px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >

              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${
                    activeImage * 100
                  }%)`,
                }}
              >

                {images.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className="flex h-full min-w-full items-center justify-center bg-white"
                  >

                    <img
                      src={img}
                      alt={`${displayName || ""} ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                  </div>
                ))}

              </div>

              {/* PREVIOUS */}

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:bg-slate-50 sm:left-3 sm:h-9 sm:w-9"
                >
                  ‹
                </button>
              )}

              {/* NEXT */}

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:bg-slate-50 sm:right-3 sm:h-9 sm:w-9"
                >
                  ›
                </button>
              )}

              {/* DOTS */}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        setActiveImage(index)
                      }
                      aria-label={`Image ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === index
                          ? "w-5 bg-sky-700"
                          : "w-1.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              )}

            </div>

            {/* THUMBNAILS — MAX 6 */}

            {visibleThumbnails.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:gap-3">
                {visibleThumbnails.map(
                  (img, index) => (
                    <button
                      key={`${img}-thumb-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(index)
                      }
                      className={`h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-lg bg-white sm:h-[64px] sm:w-[64px] ${
                        activeImage === index
                          ? "border-2 border-sky-700"
                          : "border border-slate-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${displayName || ""} thumbnail ${
                          index + 1
                        }`}
                        className="h-full w-full object-contain p-1"
                      />
                    </button>
                  )
                )}
              </div>
            )}

          </div>

          {/* ================= DETAILS ================= */}

          <div className="min-w-0 text-left">

            <div>
              <h1 className="text-base font-semibold leading-6 text-slate-900 sm:text-xl md:text-2xl">
                {displayName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-[#E30613] sm:text-xl">
                  {formatCurrency(Number(product.price), currency)}
                </span>

                {product.oldPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(Number(product.oldPrice), currency)}
                  </span>
                )}

                {discount > 0 && (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#E30613]">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleLike}
                disabled={likeLoading}
                aria-label={
                  liked
                    ? t("Unlike this product", "Ondoa Like")
                    : t("Like this product", "Like bidhaa hii")
                }
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                  liked
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                } ${likeLoading ? "opacity-60" : ""}`}
              >
                <span className="text-sm">{liked ? "❤️" : "♡"}</span>
                <span>{likes}+ {t("Likes", "Likes")}</span>
              </button>

              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600">
                <span className="text-sm">🛒</span>
                <span>{orders}+ {t("Orders", "Orders")}</span>
              </div>
            </div>

            {displayDescription && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {t("Description", "Maelezo")}
                </h3>

                <p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  {displayDescription}
                </p>
              </div>
            )}

            {(displayKeyFeatures.length > 0 ||
              Object.keys(displaySpecifications).length > 0) && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {displayKeyFeatures.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                        <span className="mr-1.5 text-[#E30613]">✓</span>
                        {t("Key Features", "Vipengele Muhimu")}
                      </h3>

                      <ul className="mt-2 space-y-1.5 pl-4 text-xs leading-5 text-slate-600 sm:text-sm">
                        {displayKeyFeatures.map((feature, index) => (
                          <li
                            key={`${feature}-${index}`}
                            className="list-disc"
                          >
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Object.keys(displaySpecifications).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                        <span className="mr-1.5 text-[#E30613]">⚙</span>
                        {t("Specifications", "Specifications")}
                      </h3>

                      <div className="mt-2 overflow-hidden rounded-md border border-slate-100">
                        {Object.entries(displaySpecifications).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-100 px-3 py-1.5 text-xs last:border-b-0 sm:text-sm"
                            >
                              <span className="font-medium text-slate-700">
                                {key}
                              </span>

                              <span className="text-slate-600">
                                {String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="mt-4 text-xs font-medium text-green-600 sm:text-sm">
              ✓ {t("In Stock", "Zinapatikana")} ({product.stock})
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-slate-600">
                  {t("Color", "Rangi")}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-md px-3 py-1.5 text-xs transition ${
                        selectedColor === color
                          ? "border border-[#E30613] bg-red-50 text-[#E30613]"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-slate-600">
                  {t("Size", "Ukubwa")}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-md px-3 py-1.5 text-xs transition ${
                        selectedSize === size
                          ? "border border-[#E30613] bg-red-50 text-[#E30613]"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-slate-600">
                {t("Quantity", "Idadi")}
              </p>

              <div className="flex w-fit items-center overflow-hidden rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 text-sm text-slate-600 hover:bg-slate-50"
                >
                  −
                </button>

                <span className="flex h-8 w-9 items-center justify-center border-x border-slate-200 text-xs">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(product.stock || 1, q + 1)
                    )
                  }
                  className="h-8 w-8 text-sm text-slate-600 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={addToCart}
                className="rounded-md bg-[#E30613] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
              >
                🛒 {t("Add", "Ongeza")}
              </button>

              <button
                type="button"
                onClick={buyNow}
                className="rounded-md border border-[#E30613] px-5 py-2.5 text-xs font-semibold text-[#E30613] hover:bg-red-50"
              >
                ⚡ {t("Buy", "Nunua")}
              </button>
            </div>

            <a
              href="https://wa.me/255798555221"
              className="mt-2 inline-flex rounded-md bg-green-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-green-700"
            >
              💬 {t("WhatsApp", "WhatsApp")}
            </a>

          </div>

        </div>

      </section>

      {/* ================= RELATED PRODUCTS ================= */}

      <RelatedProducts
        products={related}
        language={language}
      />

      {/* ================= REVIEWS ================= */}

      <section
        id="reviews"
        className="mx-auto max-w-6xl border-t border-slate-200 py-4"
      >

        <h2 className="text-sm font-medium text-slate-900">
          {t("Customer Reviews", "Maoni ya Wateja")}
        </h2>

        {/* REAL REVIEW SUMMARY */}

        <div className="mt-3 flex items-center gap-3">

          <span className="text-[26px] font-extrabold text-amber-500">
            {averageRating}
          </span>

          <div>

            <div className="text-sm text-amber-500">
              {"★".repeat(
                Math.round(
                  Number(averageRating) || 0
                )
              )}
              <span className="text-slate-300">
                {"★".repeat(
                  Math.max(
                    0,
                    5 -
                      Math.round(
                        Number(averageRating) || 0
                      )
                  )
                )}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {reviewCount}{" "}
              {reviewCount === 1
                ? "review"
                : "reviews"}
            </p>

          </div>

        </div>

        {/* WRITE REVIEW */}

        <div className="mt-6 rounded-lg border border-slate-200 p-3">

          <h3 className="text-[14px] font-normal text-slate-800">
            {t("Leave a Review", "Acha Maoni")}
          </h3>

          {/* STAR SELECTOR */}

          <div className="mt-2 flex gap-1">

            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setReviewRating(star)
                }
                aria-label={`Rate ${star} stars`}
                className={`text-lg transition ${
                  star <= reviewRating
                    ? "text-amber-400"
                    : "text-slate-300"
                }`}
              >
                ★
              </button>
            ))}

          </div>

          {/* COMMENT */}

          <textarea
            value={reviewComment}
            onChange={(e) =>
              setReviewComment(e.target.value)
            }
            placeholder="Write your comment..."
            className="mt-4 min-h-[110px] w-full resize-y rounded-xl border border-slate-200 p-3 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-700"
          />

          {/* SUBMIT */}

          <button
            type="button"
            onClick={submitReview}
            disabled={reviewLoading}
            className="mt-3 rounded-xl bg-sky-700 px-5 py-3 text-[13px] font-normal text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reviewLoading
              ? "Submitting..."
              : "Submit Review"}
          </button>

        </div>

        {/* EXISTING REVIEWS */}

        <div className="mt-6 space-y-4">

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-slate-200 p-3"
              >

                <div className="text-[15px] text-amber-400">
                  {"★".repeat(review.rating)}
                  <span className="text-slate-300">
                    {"★".repeat(
                      Math.max(
                        0,
                        5 - review.rating
                      )
                    )}
                  </span>
                </div>

                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  {review.comment}
                </p>

                <p className="mt-2 text-[11px] text-slate-400">
                  {new Date(
                    review.created_at
                  ).toLocaleDateString()}
                </p>

              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">

              <div className="text-lg text-slate-300">
                ★★★★★
              </div>

              <p className="mt-2 text-[13px] font-normal text-slate-400">
                No reviews yet.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Be the first to review this product.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* ================= MOBILE STICKY BAR ================= */}

      <div className="fixed bottom-4 right-4 z-50">
  <button
    type="button"
    onClick={() => router.push("/cart")}
    className="rounded-full bg-slate-900 px-5 py-3 text-xs font-medium text-white shadow-lg hover:bg-slate-800"
  >
    🛒 Cart ({cartCount})
  </button>
</div>

    </main>
  );
}
