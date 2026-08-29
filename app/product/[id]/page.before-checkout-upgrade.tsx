"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById, getProducts } from "@/lib/products";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category?: string;
  stock: number;
  description?: string;
  image?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
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

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
const [cartCount, setCartCount] = useState(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  /*
   * LOAD PRODUCT + REVIEWS
   */
  useEffect(() => {
    async function load() {
      const { id } = await params;
      const productId = Number(id);

      const item = await getProductById(productId);

      if (!item) {
        setProduct(null);
        return;
      }

      setProduct(item);

      if (item.colors && item.colors.length > 0) {
        setSelectedColor(item.colors[0]);
      }

      if (item.sizes && item.sizes.length > 0) {
        setSelectedSize(item.sizes[0]);
      }

      const all = await getProducts();

      setRelated(
        all
          .filter((p) => p.id !== productId)
          .slice(0, 4)
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

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || images[0] || "",
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
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

  /*
   * LOADING
   */
  if (!product) {
    return (
      <main className="min-h-screen bg-white p-10 text-center">
        <p className="text-sm font-bold text-slate-500">
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

  return (
    <main className="min-h-screen bg-white px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">

      {/* ================= PRODUCT HERO ================= */}

      <section className="mx-auto max-w-6xl">

        {/* BREADCRUMB */}

        <div className="mb-5 overflow-hidden text-xs text-slate-400">
          <span>Home</span>

          <span className="mx-2">›</span>

          <span>
            {product.category || "Products"}
          </span>

          <span className="mx-2">›</span>

          <span className="text-slate-600">
            {product.name}
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">

          {/* ================= IMAGE AREA ================= */}

          <div className="min-w-0">

            {/* MAIN IMAGE */}

            <div
              className="relative h-[330px] overflow-hidden rounded-2xl bg-slate-50 sm:h-[380px] md:h-[430px]"
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
                    className="flex h-full min-w-full items-center justify-center"
                  >

                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-contain p-3"
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
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-700 shadow hover:bg-white"
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
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-700 shadow hover:bg-white"
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
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {visibleThumbnails.map(
                  (img, index) => (
                    <button
                      key={`${img}-thumb-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(index)
                      }
                      className={`h-[62px] w-[62px] flex-shrink-0 overflow-hidden rounded-lg bg-white ${
                        activeImage === index
                          ? "border-2 border-sky-700"
                          : "border border-slate-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${
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

            {/* TITLE */}

            <h1 className="text-[18px] font-bold leading-6 text-slate-900 sm:text-[20px]">
              {product.name}
            </h1>

            {/* PRICE */}

            <div className="mt-5 rounded-xl bg-sky-50 px-4 py-3">

              <div className="flex flex-wrap items-center gap-3">

                <span className="text-[24px] font-extrabold text-sky-700">
                  TZS{" "}
                  {product.price.toLocaleString()}
                </span>

                {product.oldPrice && (
                  <span className="text-[14px] text-slate-400 line-through">
                    TZS{" "}
                    {product.oldPrice.toLocaleString()}
                  </span>
                )}

              </div>

              {discount > 0 && (
                <span className="mt-1 inline-block rounded bg-red-100 px-2 py-1 text-[11px] font-bold text-red-600">
                  -{discount}%
                </span>
              )}

            </div>

            {/* DESCRIPTION */}

            {product.description && (
              <p className="mt-4 text-[13px] font-medium leading-5 text-slate-500">
                {product.description}
              </p>
            )}

            {/* STOCK */}

            <div className="mt-4 text-[13px] font-bold text-green-600">
              ✓ In Stock ({product.stock})
            </div>

            {/* COLORS */}

            {product.colors &&
              product.colors.length > 0 && (
                <div className="mt-5">

                  <p className="mb-2 text-[13px] font-bold text-slate-600">
                    Color
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setSelectedColor(color)
                        }
                        className={`rounded-lg px-3 py-2 text-[13px] font-bold ${
                          selectedColor === color
                            ? "border-2 border-sky-700 bg-sky-50 text-sky-700"
                            : "border border-slate-300 text-slate-600"
                        }`}
                      >
                        {color}
                      </button>
                    ))}

                  </div>

                </div>
              )}

            {/* SIZES */}

            {product.sizes &&
              product.sizes.length > 0 && (
                <div className="mt-5">

                  <p className="mb-2 text-[13px] font-bold text-slate-600">
                    Size
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSelectedSize(size)
                        }
                        className={`rounded-lg px-3 py-2 text-[13px] font-bold ${
                          selectedSize === size
                            ? "border-2 border-sky-700 bg-sky-50 text-sky-700"
                            : "border border-slate-300 text-slate-600"
                        }`}
                      >
                        {size}
                      </button>
                    ))}

                  </div>

                </div>
              )}

            {/* QUANTITY */}

            <div className="mt-5">

              <p className="mb-2 text-[13px] font-bold text-slate-600">
                Quantity
              </p>

              <div className="flex w-fit items-center overflow-hidden rounded-lg border border-slate-200">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.max(1, q - 1)
                    )
                  }
                  className="h-9 w-9 text-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  −
                </button>

                <span className="flex h-9 w-10 items-center justify-center border-x border-slate-200 text-[13px] font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(
                        product.stock || 1,
                        q + 1
                      )
                    )
                  }
                  className="h-9 w-9 text-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  +
                </button>

              </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="mt-5 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={addToCart}
                className="rounded-xl bg-sky-700 px-4 py-3 text-[13px] font-extrabold text-white shadow-sm hover:bg-sky-800"
              >
                🛒 Add to Cart
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/checkout")
                }
                className="rounded-xl border-2 border-sky-700 px-4 py-3 text-[13px] font-extrabold text-sky-700 hover:bg-sky-50"
              >
                ⚡ Buy Now
              </button>

            </div>

            {/* WHATSAPP */}

            <a
              href="https://wa.me/255798555221"
              className="mt-3 block rounded-xl bg-green-600 px-4 py-3 text-center text-[13px] font-extrabold text-white hover:bg-green-700"
            >
              💬 WhatsApp
            </a>

          </div>

        </div>

      </section>

      {/* ================= DESCRIPTION ================= */}

      <section className="mx-auto mt-10 max-w-6xl border-t border-slate-200">

        <div className="flex gap-6 overflow-x-auto border-b border-slate-200 pt-5 text-[13px] font-bold">

          <button
            type="button"
            className="border-b-2 border-sky-700 pb-3 text-sky-700"
          >
            Description
          </button>

          <button
            type="button"
            className="pb-3 text-slate-400"
          >
            Specifications
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("reviews")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className="pb-3 text-slate-400"
          >
            Reviews
          </button>

        </div>

        <div className="py-7">

          <h2 className="text-[16px] font-bold text-slate-900">
            Product Description
          </h2>

          <p className="mt-3 max-w-4xl text-[13px] leading-6 text-slate-500">
            {product.description ||
              "No additional product description available."}
          </p>

        </div>

      </section>

      {/* ================= REVIEWS ================= */}

      <section
        id="reviews"
        className="mx-auto max-w-6xl border-t border-slate-200 py-8"
      >

        <h2 className="text-[18px] font-bold text-slate-900">
          Customer Reviews
        </h2>

        {/* REAL REVIEW SUMMARY */}

        <div className="mt-4 flex items-center gap-4">

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

        <div className="mt-6 rounded-xl border border-slate-200 p-4">

          <h3 className="text-[14px] font-bold text-slate-800">
            Leave a Review
          </h3>

          {/* STAR SELECTOR */}

          <div className="mt-3 flex gap-1">

            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setReviewRating(star)
                }
                aria-label={`Rate ${star} stars`}
                className={`text-2xl transition ${
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
            className="mt-3 rounded-xl bg-sky-700 px-5 py-3 text-[13px] font-bold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="rounded-xl border border-slate-200 p-4"
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

              <div className="text-2xl text-slate-300">
                ★★★★★
              </div>

              <p className="mt-2 text-[13px] font-bold text-slate-400">
                No reviews yet.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Be the first to review this product.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* ================= RELATED PRODUCTS ================= */}

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-slate-200 py-8">

          <h2 className="mb-5 text-[18px] font-bold text-slate-900">
            You May Also Like
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

            {related.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  router.push(
                    `/product/${item.id}`
                  )
                }
                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:shadow-md"
              >

                <div className="h-40 bg-slate-50">

                  <img
                    src={
                      item.image ||
                      item.images?.[0] ||
                      ""
                    }
                    alt={item.name}
                    className="h-full w-full object-contain p-3"
                  />

                </div>

                <div className="p-3">

                  <p className="line-clamp-2 text-[12px] font-bold text-slate-700">
                    {item.name}
                  </p>

                  <p className="mt-2 text-[13px] font-extrabold text-sky-700">
                    TZS{" "}
                    {item.price.toLocaleString()}
                  </p>

                  {item.oldPrice && (
                    <p className="text-[11px] text-slate-400 line-through">
                      TZS{" "}
                      {item.oldPrice.toLocaleString()}
                    </p>
                  )}

                </div>

              </button>
            ))}

          </div>

        </section>
      )}

      {/* ================= MOBILE STICKY BAR ================= */}

      <div className="fixed bottom-4 right-4 z-50">
  <button
    type="button"
    onClick={() => router.push("/cart")}
    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-slate-800"
  >
    🛒 Cart ({cartCount})
  </button>
</div>

    </main>
  );
}
