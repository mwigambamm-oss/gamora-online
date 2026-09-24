"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById, getProducts, shuffleProducts, getProductVariants, type ProductVariant } from "@/lib/products";
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
  image_color_map?: Record<
    string,
    {
      images: string[];
      confidence: number;
    }
  >;
  colors?: string[];
  sizes?: string[];
  sizePrices?: Record<string, number>;
  sizeQuantities?: Record<string, number>;
  specifications?: Record<string, string>;
  specifications_sw?: Record<string, string>;
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const displayName = product?.name;

  const displayCategory = product?.category;

  const activeDescription =
    language === "sw"
      ? product?.description_sw || product?.description || ""
      : product?.description || "";

  const parsedProduct = product
    ? normalizeProductDescription(activeDescription)
    : {
        description: "",
        key_features: [],
        specifications: {},
      };

  const displayDescription = parsedProduct.description;

  const displayKeyFeatures = parsedProduct.key_features;

  const storedSpecifications =
    language === "sw"
      ? product?.specifications_sw || {}
      : product?.specifications || {};

  /*
   * Always prefer specifications parsed from the active description.
   * This prevents old/corrupted stored specification records from
   * mixing Key Features into the Specifications section.
   */
  const displaySpecifications =
    Object.keys(parsedProduct.specifications).length > 0
      ? parsedProduct.specifications
      : storedSpecifications;

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
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeQuantitiesSelected, setSizeQuantitiesSelected] =
    useState<Record<string, number>>({});
  const [selectedModel, setSelectedModel] = useState("");
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

      // LOAD PRODUCT VARIANTS
      const productVariants = await getProductVariants(productId);
      setVariants(productVariants);

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
        setSelectedSizes([]);
      }

      const all = await getProducts();

      setRelated(
        shuffleProducts(
          all.filter(
            (p) =>
              p.id !== productId &&
              p.category === item.category
          )
        )
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

      const count = Array.isArray(cart) ? cart.length : 0;

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
   * ACTIVE PRODUCT VARIANT
   */
  const availableVariants = variants.filter(
    (variant) => variant.is_active !== false
  );

  const selectedVariant =
    availableVariants.find((variant) => {
      const colorMatches =
        !selectedColor ||
        (variant.color || "").trim().toLowerCase() ===
          selectedColor.trim().toLowerCase();

      const sizeMatches =
        !selectedSize ||
        (variant.size || "").trim().toLowerCase() ===
          selectedSize.trim().toLowerCase();

      const modelMatches =
        !selectedModel ||
        (variant.model || "").trim().toLowerCase() ===
          selectedModel.trim().toLowerCase();

      return colorMatches && sizeMatches && modelMatches;
    }) || null;

  const sizePrice =
    selectedSize && product?.sizePrices
      ? product.sizePrices[selectedSize]
      : undefined;

  const displayPrice =
    sizePrice !== undefined && Number.isFinite(Number(sizePrice))
      ? Number(sizePrice)
      : selectedVariant?.price !== undefined
        ? Number(selectedVariant.price)
        : Number(product?.price) || 0;

  const displayOldPrice =
    selectedVariant?.old_price !== undefined
      ? Number(selectedVariant.old_price)
      : Number(product?.oldPrice) || 0;

  const sizeQuantity =
    selectedSize && product?.sizeQuantities
      ? product.sizeQuantities[selectedSize]
      : undefined;

  const displayStock =
    sizeQuantity !== undefined &&
    Number.isFinite(Number(sizeQuantity))
      ? Number(sizeQuantity)
      : selectedVariant
        ? Number(selectedVariant.stock) || 0
        : Number(product?.stock) || 0;

  const displaySku =
    selectedVariant?.sku || "";

  const selectedColorList =
    selectedColors.length > 0
      ? selectedColors
      : selectedColor
      ? [selectedColor]
      : [];

  const selectedColorSizeLines = selectedColorList.flatMap((color) =>
    selectedSizes.map((size) => {
      const normalizedColor = color.trim().toLowerCase();
      const normalizedSize = size.trim().toLowerCase();

      const matchingVariant = availableVariants.find(
        (item) =>
          (item.color || "").trim().toLowerCase() === normalizedColor &&
          (item.size || "").trim().toLowerCase() === normalizedSize &&
          (!selectedModel ||
            (item.model || "").trim().toLowerCase() ===
              selectedModel.trim().toLowerCase())
      );

      const priceValue =
        matchingVariant?.price !== undefined
          ? Number(matchingVariant.price)
          : product?.sizePrices?.[size] !== undefined
          ? Number(product.sizePrices[size])
          : Number(product?.price) || 0;

      const stockValue =
        matchingVariant?.stock !== undefined
          ? Number(matchingVariant.stock) || 0
          : product?.sizeQuantities?.[size] !== undefined
          ? Number(product.sizeQuantities[size])
          : Number(product?.stock) || 0;

      const quantityKey = `${color}::${size}`;
      const rawQuantity =
        Number(sizeQuantitiesSelected[quantityKey]) || 1;

      const itemQuantity =
        stockValue > 0
          ? Math.min(
              Math.max(Math.floor(rawQuantity), 1),
              stockValue
            )
          : Math.max(Math.floor(rawQuantity), 1);

      return {
        color,
        size,
        price: priceValue,
        stock: stockValue,
        quantityKey,
        quantity: itemQuantity,
        subtotal: priceValue * itemQuantity,
        variantId: matchingVariant?.id || null,
        sku: matchingVariant?.sku || "",
        oldPrice:
          matchingVariant?.old_price !== undefined
            ? Number(matchingVariant.old_price)
            : Number(product?.oldPrice) || 0,
        images:
          matchingVariant?.images &&
          matchingVariant.images.length > 0
            ? matchingVariant.images
            : getColorImages(color),
      };
    })
  );

  const selectedSizesTotal = selectedColorSizeLines.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  /*
   * PRODUCT IMAGES
   */
  const hasColorImageMap =
    !!product?.image_color_map &&
    Object.keys(product.image_color_map).length > 0;

  const selectedColorImages = (() => {
    if (!selectedColor || !product?.image_color_map) {
      return [];
    }

    const map = product.image_color_map;

    const matchedKey = Object.keys(map).find(
      (key) =>
        key.trim().toLowerCase() ===
        selectedColor.trim().toLowerCase()
    );

    return matchedKey
      ? map[matchedKey]?.images || []
      : [];
  })();

  function getColorImages(color: string): string[] {
    const map = product?.image_color_map || {};

    const matchedKey = Object.keys(map).find(
      (key) =>
        key.trim().toLowerCase() ===
        color.trim().toLowerCase()
    );

    return matchedKey
      ? map[matchedKey]?.images || []
      : [];
  }

  function getColorHasStock(color: string): boolean {
    const normalizedColor = color.trim().toLowerCase();

    if (availableVariants.length > 0) {
      return availableVariants.some(
        (variant) =>
          (variant.color || "").trim().toLowerCase() ===
            normalizedColor &&
          Number(variant.stock) > 0
      );
    }

    return Number(product?.stock) > 0;
  }

  function getColorStatus(color: string): "available" | "no-image" | "out-of-stock" {
    const hasImages = getColorImages(color).length > 0;

    if (!hasImages) {
      return "no-image";
    }

    if (!getColorHasStock(color)) {
      return "out-of-stock";
    }

    return "available";
  }

  const colorOutOfStock =
    !!selectedVariant &&
    displayStock <= 0;

  const variantImages =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : selectedColor && selectedColorImages.length > 0
      ? selectedColorImages
      : product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  const images = variantImages;

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
  }, [product?.id, selectedColor, selectedSize, selectedModel, selectedVariant?.id]);

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

    if (colorOutOfStock) {
      alert("This color is currently unavailable.");
      return;
    }

    const cartImage =
      images[0] ||
      product.image ||
      "";

    /*
     * MULTI-COLOR / MULTI-SIZE CART
     * One cart line is created for each selected color + size.
     */
    if (
      selectedColorList.length > 0 &&
      selectedSizes.length > 0
    ) {
      const multiSelectionItems = selectedColorSizeLines.map((item) => ({
        id: product.id,
        variantId: item.variantId,
        sku: item.sku,
        name: product.name,
        price: item.price,
        oldPrice:
          item.oldPrice || displayOldPrice || undefined,
        stock: item.stock,
        image:
          item.images?.[0] ||
          cartImage,
        quantity: item.quantity,
        selectedColor: item.color,
        selectedSize: item.size,
        selectedModel: selectedModel,
      }));

      try {
        const existing = localStorage.getItem("gamora_cart");
        const cart = existing ? JSON.parse(existing) : [];

        for (const cartItem of multiSelectionItems) {
          const existingIndex = cart.findIndex(
            (item: {
              id: number;
              variantId?: number | null;
              selectedColor?: string;
              selectedSize?: string;
              selectedModel?: string;
            }) =>
              item.id === product.id &&
              (item.variantId || null) ===
                (cartItem.variantId || null) &&
              item.selectedColor ===
                cartItem.selectedColor &&
              item.selectedSize ===
                cartItem.selectedSize &&
              item.selectedModel ===
                cartItem.selectedModel
          );

          if (existingIndex >= 0) {
            cart[existingIndex].quantity +=
              cartItem.quantity;
          } else {
            cart.push(cartItem);
          }
        }

        localStorage.setItem(
          "gamora_cart",
          JSON.stringify(cart)
        );

        window.dispatchEvent(
          new Event("cartUpdated")
        );
      } catch (error) {
        console.error("Cart error:", error);
      }

      return;
    }

    /*
     * EXISTING SINGLE-SIZE / NORMAL PRODUCT CART
     */
    const cartItem = {
      id: product.id,
      variantId: selectedVariant?.id || null,
      sku: selectedVariant?.sku || "",
      name: product.name,
      price: displayPrice,
      oldPrice: displayOldPrice || undefined,
      stock: displayStock,
      image: cartImage,
      quantity: quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      selectedModel: selectedModel,
    };

    try {
      const existing = localStorage.getItem("gamora_cart");
      const cart = existing ? JSON.parse(existing) : [];

      const existingIndex = cart.findIndex(
        (item: {
          id: number;
          variantId?: number | null;
          selectedColor?: string;
          selectedSize?: string;
          selectedModel?: string;
        }) =>
          item.id === product.id &&
          (item.variantId || null) ===
            (selectedVariant?.id || null) &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize &&
          item.selectedModel === selectedModel
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem(
        "gamora_cart",
        JSON.stringify(cart)
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Cart error:", error);
    }
  }

  function buyNow() {
    if (!product) return;

    if (colorOutOfStock) {
      alert("This color is currently unavailable.");
      return;
    }

    const cartImage =
      images[0] ||
      product.image ||
      "";

    /*
     * MULTI-COLOR / MULTI-SIZE BUY NOW
     * Send every selected color + size + quantity to checkout.
     */
    if (
      selectedColorList.length > 0 &&
      selectedSizes.length > 0
    ) {
      const multiSelectionItems = selectedColorSizeLines.map(
        (item) => ({
          id: product.id,
          variantId: item.variantId,
          sku: item.sku,
          name: product.name,
          price: item.price,
          oldPrice:
            item.oldPrice || displayOldPrice || undefined,
          stock: item.stock,
          image:
            item.images?.[0] ||
            cartImage,
          quantity: item.quantity,
          selectedColor: item.color,
          selectedSize: item.size,
          selectedModel: selectedModel,
        })
      );

      try {
        localStorage.setItem(
          "gamora_cart",
          JSON.stringify(multiSelectionItems)
        );

        window.dispatchEvent(
          new Event("cartUpdated")
        );

        router.push("/checkout");
      } catch (error) {
        console.error("Buy now error:", error);
      }

      return;
    }

    /*
     * EXISTING SINGLE-SIZE / NORMAL PRODUCT BUY NOW
     */
    const cartItem = {
      id: product.id,
      variantId: selectedVariant?.id || null,
      sku: selectedVariant?.sku || "",
      name: product.name,
      price: displayPrice,
      oldPrice: displayOldPrice || undefined,
      stock: displayStock,
      image: cartImage,
      quantity: quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      selectedModel: selectedModel,
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
  const visibleThumbnails = images;

  /*
   * DISCOUNT
   */
  const discount =
    displayOldPrice > displayPrice
      ? Math.round(
          ((displayOldPrice - displayPrice) /
            displayOldPrice) *
            100
        )
      : 0;

  /*
   * AUTOMATIC BULK PRICING
   * Based on the product's selling price.
   */
  const basePrice = displayPrice;

  const bulkPrices = {
    ten: Math.round(basePrice * 0.98),
    fifty: Math.round(basePrice * 0.95),
    hundred: Math.round(basePrice * 0.90),
  };

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

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Unable to update like"
          );
        }
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
          <a
            href="/"
            className="transition-colors hover:text-[#D00000]"
          >
            {t("Home", "Nyumbani")}
          </a>

          <span className="mx-2">›</span>

          {displayCategory ? (
            <a
              href={`/category/${encodeURIComponent(displayCategory)}`}
              className="transition-colors hover:text-[#D00000]"
            >
              {displayCategory}
            </a>
          ) : (
            <span>{t("Products", "Bidhaa")}</span>
          )}

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

              {colorOutOfStock ? (
                <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 text-4xl">×</div>
                  <p className="text-base font-semibold text-slate-800 sm:text-lg">
                    {selectedColor}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#E30613]">
                    {t("This color is out of stock", "Rangi hii imekwisha")}
                  </p>
                </div>
              ) : (
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
              )}

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

              <div className="mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-[#E30613] sm:text-xl">
                    {formatCurrency(basePrice, currency)}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500">
                    / pc
                  </span>

                  {product.oldPrice && (
                    <span className="text-xs text-[#E30613] line-through">
                      {formatCurrency(displayOldPrice, currency)}
                    </span>
                  )}

                  {discount > 0 && (
                    <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#E30613]">
                      -{discount}%
                    </span>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#D97706]">
                    {t("Bulk Pricing", "Bei ya Jumla")}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
                      <div className="text-[9px] font-semibold text-[#E30613]">
                        1 pc
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-slate-900">
                        {formatCurrency(basePrice, currency)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
                      <div className="text-[9px] font-semibold text-[#E30613]">
                        10+ pcs
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-slate-900">
                        ≈ {formatCurrency(bulkPrices.ten, currency)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
                      <div className="text-[9px] font-semibold text-[#E30613]">
                        50+ pcs
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-slate-900">
                        ≈ {formatCurrency(bulkPrices.fifty, currency)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
                      <div className="text-[9px] font-semibold text-[#E30613]">
                        100+ pcs
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-slate-900">
                        ≈ {formatCurrency(bulkPrices.hundred, currency)}
                      </div>
                    </div>
                  </div>
                </div>
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
                    ? "border-red-200 bg-red-50 text-[#E30613]"
                    : "border-red-200 bg-white text-[#E30613] hover:bg-red-50"
                } ${likeLoading ? "opacity-60" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                  />
                </svg>
                <span>{likes}+ {t("Likes", "Likes")}</span>
              </button>

              <div className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#E30613]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="19" cy="20" r="1" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"
                  />
                </svg>
                <span>{orders}+ {t("Orders", "Orders")}</span>
              </div>
            </div>

            <div className="mt-4 text-xs font-medium text-green-600 sm:text-sm">
              ✓ {t("In Stock", "Zinapatikana")} ({displayStock})
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-4">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600">
                    {t("Color", "Rangi")}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((color) => {
                      const colorStatus = getColorStatus(color);
                      const unavailable =
                        colorStatus !== "available";

                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            if (!unavailable) {
                              setSelectedColors((current) => {
                                const alreadySelected =
                                  current.some(
                                    (item) =>
                                      item.trim().toLowerCase() ===
                                      color.trim().toLowerCase()
                                  );

                                if (alreadySelected) {
                                  const next = current.filter(
                                    (item) =>
                                      item.trim().toLowerCase() !==
                                      color.trim().toLowerCase()
                                  );

                                  setSelectedColor(
                                    selectedColor.trim().toLowerCase() ===
                                      color.trim().toLowerCase()
                                      ? next[0] || ""
                                      : selectedColor
                                  );

                                  return next;
                                }

                                setSelectedColor(color);
                                return [...current, color];
                              });
                            }
                          }}
                          title={
                            colorStatus === "no-image"
                              ? `${color} unavailable`
                              : colorStatus === "out-of-stock"
                              ? `${color} out of stock`
                              : color
                          }
                          className={`rounded-md px-3 py-1.5 text-xs transition ${
                            unavailable
                              ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                              : selectedColors.some(
                                  (item) =>
                                    item.trim().toLowerCase() ===
                                    color.trim().toLowerCase()
                                )
                              ? "border border-[#E30613] bg-red-50 text-[#E30613]"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{color}</span>

                            {colorStatus === "no-image" && (
                              <span className="text-[10px] font-medium text-slate-400">
                                Unavailable
                              </span>
                            )}

                            {colorStatus === "out-of-stock" && (
                              <span className="text-[10px] font-medium text-[#E30613]">
                                Out of stock
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedColorSizeLines.length > 0 && (
                <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-slate-600">
                    {t("Selected", "Umechagua")}
                  </p>

                  <div className="space-y-1.5">
                    {selectedColorSizeLines.map((item) => (
                      <div
                        key={`${item.color}::${item.size}`}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span>
                          {item.color} — Size {item.size} ×{" "}
                          <strong>{item.quantity}</strong> @{" "}
                          {formatCurrency(item.price, currency)} ={" "}
                          <strong>
                            {formatCurrency(item.subtotal, currency)}
                          </strong>
                        </span>

                        <div className="flex items-center rounded-md border border-slate-300 bg-white">
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.color} size ${item.size}`}
                            onClick={() => {
                              setSizeQuantitiesSelected((current) => ({
                                ...current,
                                [item.quantityKey]: Math.max(
                                  1,
                                  (Number(current[item.quantityKey]) || 1) - 1
                                ),
                              }));
                            }}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center text-lg font-bold text-slate-800 hover:bg-slate-100 active:bg-slate-200"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={
                              item.stock > 0
                                ? item.stock
                                : undefined
                            }
                            value={
                              Number(
                                sizeQuantitiesSelected[
                                  item.quantityKey
                                ]
                              ) || 1
                            }
                            aria-label={`Quantity for ${item.color} size ${item.size}`}
                            onChange={(event) => {
                              const value = event.target.value;

                              if (value === "") {
                                return;
                              }

                              const parsed = Math.floor(
                                Number(value)
                              );

                              if (!Number.isFinite(parsed)) {
                                return;
                              }

                              const maximum =
                                item.stock > 0
                                  ? item.stock
                                  : Infinity;

                              setSizeQuantitiesSelected((current) => ({
                                ...current,
                                [item.quantityKey]: Math.min(
                                  maximum,
                                  Math.max(1, parsed)
                                ),
                              }));
                            }}
                            className="h-9 w-14 border-x border-slate-300 bg-white px-1 text-center text-sm font-bold text-slate-900 outline-none"
                          />

                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.color} size ${item.size}`}
                            disabled={
                              item.stock > 0 &&
                              (Number(
                                sizeQuantitiesSelected[
                                  item.quantityKey
                                ]
                              ) || 1) >= item.stock
                            }
                            onClick={() => {
                              setSizeQuantitiesSelected((current) => {
                                const currentQuantity =
                                  Number(
                                    current[item.quantityKey]
                                  ) || 1;

                                const maximum =
                                  item.stock > 0
                                    ? item.stock
                                    : Infinity;

                                return {
                                  ...current,
                                  [item.quantityKey]: Math.min(
                                    maximum,
                                    currentQuantity + 1
                                  ),
                                };
                              });
                            }}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center text-lg font-bold text-slate-800 hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 border-t border-slate-200 pt-2 text-right text-sm font-bold text-slate-900">
                      {t("Total", "Jumla")}:{" "}
                      {formatCurrency(
                        selectedSizesTotal,
                        currency
                      )}
                    </div>
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="w-full">
                  <p className="mb-1.5 text-xs font-medium text-slate-600">
                    {t("Size", "Ukubwa")}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);

                      const sizeStock =
                        product.sizeQuantities &&
                        product.sizeQuantities[size] !== undefined
                          ? Number(product.sizeQuantities[size])
                          : null;

                      const unavailable =
                        sizeStock !== null && sizeStock <= 0;

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            if (unavailable) return;

                            setSelectedSizes((current) => {
                              const isAlreadySelected = current.includes(size);

                              if (isAlreadySelected) {
                                setSizeQuantitiesSelected((quantities) => {
                                  const next = { ...quantities };
                                  delete next[size];
                                  return next;
                                });

                                const next = current.filter(
                                  (item) => item !== size
                                );
                                setSelectedSize(next[0] || "");
                                return next;
                              }

                              setSizeQuantitiesSelected((quantities) => ({
                                ...quantities,
                                [size]: 1,
                              }));

                              const next = [...current, size];
                              setSelectedSize(next[0] || "");
                              return next;
                            });
                          }}
                          className={`rounded-md px-3 py-1.5 text-xs transition ${
                            unavailable
                              ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                              : isSelected
                              ? "border border-[#E30613] bg-red-50 text-[#E30613]"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                          }`}
                        >
                          {size}
                          {isSelected && " ✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.from(
                new Set(
                  availableVariants
                    .map((variant) => variant.model)
                    .filter(Boolean)
                )
              ).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600">
                    {t("Model", "Modeli")}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set(
                        availableVariants
                          .map((variant) => variant.model)
                          .filter(
                            (model): model is string => Boolean(model)
                          )
                      )
                    ).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => setSelectedModel(model)}
                        className={`rounded-md px-3 py-1.5 text-xs transition ${
                          selectedModel === model
                            ? "border border-[#E30613] bg-red-50 text-[#E30613]"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSizes.length === 0 && (
              <div>
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

                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      if (!e.target.value) {
                        setQuantity(1);
                        return;
                      }

                      setQuantity(Math.max(1, value));
                    }}
                    className="h-8 w-12 border-x border-slate-200 bg-white text-center text-xs outline-none focus:bg-red-50"
                    aria-label={t("Quantity", "Idadi")}
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-8 w-8 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>
              )}
            </div>

            {displayDescription && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {t("Description", "Maelezo")}
                </h3>

                <p className="mt-1.5 max-w-3xl whitespace-pre-line text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  {displayDescription}
                </p>
              </div>
            )}

            {(displayKeyFeatures.length > 0 ||
              Object.keys(displaySpecifications).length > 0) && (
              <div className="mt-5 border-t border-slate-100 pt-4">

                {displayKeyFeatures.length > 0 && (
                  <section className="min-w-0">
                    <h3 className="flex items-center text-sm font-bold text-slate-900 sm:text-base">
                      <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-[#E30613]">
                        ✓
                      </span>
                      {t("Key Features", "Vipengele Muhimu")}
                    </h3>

                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <ul className="space-y-2.5">
                        {displayKeyFeatures.map((feature, index) => (
                          <li
                            key={`${feature}-${index}`}
                            className="flex items-start gap-2.5 text-xs leading-5 text-slate-600 sm:text-sm"
                          >
                            <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#E30613]" />
                            <span className="min-w-0">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {Object.keys(displaySpecifications).length > 0 && (
                  <section
                    className={
                      displayKeyFeatures.length > 0
                        ? "mt-5 min-w-0"
                        : "min-w-0"
                    }
                  >
                    <h3 className="flex items-center text-sm font-bold text-slate-900 sm:text-base">
                      <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs text-[#E30613]">
                        ⚙
                      </span>
                      {t("Specifications", "Specifications")}
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-lg border border-red-100/70 bg-red-50/25">
                      {Object.entries(displaySpecifications).map(
                        ([key, value], index) => {
                          const isSameValue =
                            String(key).trim().toLowerCase() ===
                            String(value).trim().toLowerCase();

                          return (
                            <div
                              key={`${key}-${index}`}
                              className="grid grid-cols-[minmax(100px,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-red-100/60 px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(140px,0.8fr)_minmax(0,1.2fr)] sm:px-4"
                            >
                              {isSameValue ? (
                                <>
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-[#E30613]">
                                    ✓
                                  </span>
                                  <span className="text-slate-600">
                                    {String(value)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-700">
                                    {key}
                                  </span>
                                  <span className="text-slate-600">
                                    {String(value)}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}

              </div>
            )}

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
