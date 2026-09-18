import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { supabase } from "./lib/supabase";

type Product = {
  id: number | string;
  name: string;
  name_sw?: string | null;
  price: number;
  old_price?: number | null;
  category?: string | null;
  stock?: number | null;
  image?: string | null;
  images?: string[] | null;
  rating?: number | null;
  discount?: number | null;
  orders_count?: number | null;
  description?: string | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  specifications?: Record<string, unknown> | null;
};

type CartItem = {
  product: Product;
  quantity: number;
  selectedColor: string | null;
  selectedSize: string | null;
};

const categories = [
  ["All", "grid-outline"],
  ["Phones", "phone-portrait-outline"],
  ["Fashion", "shirt-outline"],
  ["Shoes", "footsteps-outline"],
  ["Beauty", "sparkles-outline"],
  ["Electronics", "headset-outline"],
  ["Home & Kitchen", "home-outline"],
  ["Baby", "happy-outline"],
];

function formatPrice(price: number) {
  return `TZS ${Number(price || 0).toLocaleString("en-TZ")}`;
}

function getProductImage(product: Product) {
  return product.images?.[0] || product.image || "";
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const image = getProductImage(product);

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(
          ((product.old_price - product.price) / product.old_price) * 100
        )
      : product.discount || 0;

  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageBox}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="image-outline" size={42} color="#9ca3af" />
        )}

        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        <Pressable style={styles.heartButton}>
          <Ionicons name="heart-outline" size={20} color="#374151" />
        </Pressable>
      </View>

      <View style={styles.productInfo}>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color="#f59e0b" />
          <Text style={styles.ratingText}>
            {Number(product.rating || 0).toFixed(1)}
          </Text>
          <Text style={styles.ordersText}>
            ({product.orders_count || 0})
          </Text>
        </View>

        <Text style={styles.productPrice}>
          {formatPrice(product.price)}
        </Text>

        {!!product.old_price && product.old_price > product.price && (
          <Text style={styles.oldPrice}>
            {formatPrice(product.old_price)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  async function getCustomerLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Location permission is required for delivery.");
        return false;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            address: deliveryLocation.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("LOCATION API ERROR:", data);
        alert(data.message || "Unable to calculate delivery fee.");
        return false;
      }

      setDistanceKm(Number(data.distanceKm || 0));
      setDeliveryFee(Number(data.deliveryFee || 0));

      return true;
    } catch (error) {
      console.error("LOCATION ERROR:", error);
      alert("Unable to get your current location.");
      return false;
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,name_sw,price,old_price,category,stock,image,images,rating,discount,orders_count,description,colors,sizes,specifications"
      )
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setProducts(data as Product[]);
    } else {
      console.log("Products error:", error?.message);
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        (product.category || "")
          .toLowerCase()
          .includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const bestSellers = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            Number(b.orders_count || 0) -
            Number(a.orders_count || 0)
        )
        .slice(0, 10),
    [products]
  );

  const newArrivals = products.slice(0, 10);

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.product.price || 0) * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  if (selectedProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.detailsHeader}>
          <Pressable
            onPress={() => setSelectedProduct(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <Text style={styles.detailsHeaderTitle}>Product Details</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailsScroll}
        >
          <View style={styles.detailsImageBox}>
            {getProductImage(selectedProduct) ? (
              <Image
                source={{ uri: getProductImage(selectedProduct) }}
                style={styles.detailsImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="image-outline"
                size={70}
                color="#9ca3af"
              />
            )}
          </View>

          <View style={styles.detailsContent}>
            <Text style={styles.detailsName}>
              {selectedProduct.name}
            </Text>

            <View style={styles.detailsPriceRow}>
              <Text style={styles.detailsPrice}>
                {formatPrice(selectedProduct.price)}
              </Text>

              {selectedProduct.old_price &&
                selectedProduct.old_price > selectedProduct.price && (
                  <Text style={styles.detailsOldPrice}>
                    {formatPrice(selectedProduct.old_price)}
                  </Text>
                )}
            </View>

            <View style={styles.detailsMetaRow}>
              <Text style={styles.detailsCategory}>
                {selectedProduct.category || "General"}
              </Text>

              <Text style={styles.detailsStock}>
                {selectedProduct.stock} in stock
              </Text>
            </View>

            <View style={styles.detailsDivider} />

            <Text style={styles.detailsSectionTitle}>
              Product Description
            </Text>

            <Text style={styles.detailsDescription}>
              {selectedProduct.description?.trim() ||
                "No description available for this product."}
            </Text>

            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <View style={styles.variantSection}>
                <Text style={styles.variantTitle}>Color</Text>

                <View style={styles.variantOptions}>
                  {selectedProduct.colors.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.variantOption,
                        selectedColor === color && styles.variantOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantOptionText,
                          selectedColor === color &&
                            styles.variantOptionTextSelected,
                        ]}
                      >
                        {color}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <View style={styles.variantSection}>
                <Text style={styles.variantTitle}>Size</Text>

                <View style={styles.variantOptions}>
                  {selectedProduct.sizes.map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.variantOption,
                        selectedSize === size && styles.variantOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantOptionText,
                          selectedSize === size &&
                            styles.variantOptionTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Quantity</Text>

              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  <Ionicons name="remove" size={20} color="#111827" />
                </Pressable>

                <Text style={styles.quantityText}>{quantity}</Text>

                <Pressable
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity((current) =>
                      Math.min(
                        selectedProduct.stock || 1,
                        current + 1
                      )
                    )
                  }
                >
                  <Ionicons name="add" size={20} color="#111827" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.addToCartButton}
              onPress={() => {
                if (!selectedProduct) return;

                setCart((currentCart) => {
                  const existingIndex = currentCart.findIndex(
                    (item) =>
                      item.product.id === selectedProduct.id &&
                      item.selectedColor === selectedColor &&
                      item.selectedSize === selectedSize
                  );

                  if (existingIndex >= 0) {
                    return currentCart.map((item, index) =>
                      index === existingIndex
                        ? {
                            ...item,
                            quantity: Math.min(
                              item.quantity + quantity,
                              selectedProduct.stock || item.quantity + quantity
                            ),
                          }
                        : item
                    );
                  }

                  return [
                    ...currentCart,
                    {
                      product: selectedProduct,
                      quantity,
                      selectedColor,
                      selectedSize,
                    },
                  ];
                });

                setSelectedProduct(null);
                setSelectedColor(null);
                setSelectedSize(null);
                setQuantity(1);
              }}
            >
              <Ionicons name="cart-outline" size={22} color="#fff" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showCheckout && !selectedProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.detailsHeader}>
          <Pressable
            onPress={() => setShowCheckout(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <Text style={styles.detailsHeaderTitle}>
            Checkout
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cartScroll}
        >
          <View style={styles.cartSummary}>
            <Text style={styles.checkoutSectionTitle}>
              Delivery Information
            </Text>

            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name"
              placeholderTextColor="#9ca3af"
              style={styles.checkoutInput}
            />

            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              style={styles.checkoutInput}
            />

            <TextInput
              value={deliveryLocation}
              onChangeText={setDeliveryLocation}
              placeholder="Delivery location / address"
              placeholderTextColor="#9ca3af"
              style={[styles.checkoutInput, { minHeight: 90 }]}
              multiline
            />

            <Pressable
              style={styles.locationButton}
              onPress={async () => {
                const success = await getCustomerLocation();

                if (success) {
                  alert("Current location captured successfully.");
                }
              }}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color="#2563eb"
              />
              <Text style={styles.locationButtonText}>
                Use My Current Location
              </Text>
            </Pressable>

            {latitude !== null && longitude !== null && (
              <Text style={styles.locationCapturedText}>
                Location captured: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            )}

            <Text style={styles.checkoutSectionTitle}>
              Payment Method
            </Text>

            {["M-Pesa", "Mix by Yas", "NMB Bank", "CRDB Bank"].map(
              (method) => (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method &&
                      styles.paymentOptionSelected,
                  ]}
                >
                  <Ionicons
                    name={
                      paymentMethod === method
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={21}
                    color={
                      paymentMethod === method
                        ? "#2563eb"
                        : "#6b7280"
                    }
                  />
                  <Text style={styles.paymentOptionText}>
                    {method}
                  </Text>
                </Pressable>
              )
            )}

            <Text style={styles.checkoutSectionTitle}>
              Order Summary
            </Text>

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>
                Items ({cartItemsCount})
              </Text>
              <Text style={styles.cartSummaryValue}>
                {formatPrice(cartTotal)}
              </Text>
            </View>

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>
                Distance
              </Text>
              <Text style={styles.cartSummaryValue}>
                {distanceKm !== null
                  ? `${distanceKm.toFixed(1)} km`
                  : "Not calculated"}
              </Text>
            </View>

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>
                Delivery
              </Text>
              <Text style={styles.cartSummaryValue}>
                {distanceKm !== null
                  ? formatPrice(deliveryFee)
                  : "Calculated after location"}
              </Text>
            </View>

            <View style={styles.cartSummaryDivider} />

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartTotalLabel}>
                Total
              </Text>
              <Text style={styles.cartTotalValue}>
                {formatPrice(cartTotal + deliveryFee)}
              </Text>
            </View>

            <Pressable
              style={styles.checkoutButton}
              onPress={async () => {
                if (!customerName.trim()) {
                  alert("Please enter customer name.");
                  return;
                }

                if (!phoneNumber.trim()) {
                  alert("Please enter phone number.");
                  return;
                }

                if (!deliveryLocation.trim()) {
                  alert("Please enter delivery location.");
                  return;
                }

                if (!paymentMethod) {
                  alert("Please select a payment method.");
                  return;
                }

                if (latitude === null || longitude === null) {
                  alert("Please capture your current location for delivery.");
                  return;
                }

                const orderNumber = `GAM-${Date.now()}`;

                try {
                  const response = await fetch(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/orders`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: orderNumber,
                        customer: {
                          name: customerName.trim(),
                          phone: phoneNumber.trim(),
                          email: "",
                          address: deliveryLocation.trim(),
                          notes: `Payment method: ${paymentMethod}`,
                        },
                        location: {
                          latitude,
                          longitude,
                        },
                        distanceKm: Number(distanceKm || 0),
                        deliveryFee: Number(deliveryFee || 0),
                        deliveryMethod: "delivery",
                        items: cart.map((item) => ({
                          id: Number(item.product.id),
                          name: item.product.name,
                          price: Number(item.product.price || 0),
                          quantity: Number(item.quantity || 1),
                          image: getProductImage(item.product),
                        })),
                        subtotal: Number(cartTotal),
                        discountTotal: 0,
                        total: Number(cartTotal + deliveryFee),
                        status: "Pending",
                        createdAt: new Date().toISOString(),
                      }),
                    }
                  );

                  const result = await response.json();

                  if (!response.ok) {
                    console.error("ORDER API ERROR:", result);
                    alert(result?.error || "Failed to place order.");
                    return;
                  }

                  alert(`Order placed successfully. Order No: ${orderNumber}`);

                  setCart([]);
                  setShowCheckout(false);
                  setShowCart(false);
                  setCustomerName("");
                  setPhoneNumber("");
                  setDeliveryLocation("");
                  setPaymentMethod("");
                  setLatitude(null);
                  setLongitude(null);
                } catch (error) {
                  console.error("ORDER SUBMISSION ERROR:", error);
                  alert(
                    "Unable to connect to Gamora server. Please check your internet/Wi-Fi connection."
                  );
                }
              }}
            >
              <Text style={styles.checkoutButtonText}>
                Place Order
              </Text>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#ffffff"
              />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showCart && cartItemsCount > 0 && !selectedProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.detailsHeader}>
          <Pressable
            onPress={() => setCart([])}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <Text style={styles.detailsHeaderTitle}>
            Shopping Cart ({cartItemsCount})
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cartScroll}
        >
          {cart.map((item, index) => (
            <View key={`${item.product.id}-${index}`} style={styles.cartItem}>
              <View style={styles.cartImageBox}>
                {getProductImage(item.product) ? (
                  <Image
                    source={{ uri: getProductImage(item.product) }}
                    style={styles.cartImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={45}
                    color="#9ca3af"
                  />
                )}
              </View>

              <View style={styles.cartItemContent}>
                <Text style={styles.cartItemName} numberOfLines={2}>
                  {item.product.name}
                </Text>

                <Text style={styles.cartItemPrice}>
                  {formatPrice(item.product.price)}
                </Text>

                {item.selectedColor && (
                  <Text style={styles.cartVariant}>
                    Color: {item.selectedColor}
                  </Text>
                )}

                {item.selectedSize && (
                  <Text style={styles.cartVariant}>
                    Size: {item.selectedSize}
                  </Text>
                )}

                <View style={styles.cartBottomRow}>
                  <View style={styles.quantityRow}>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => {
                        setCart((currentCart) =>
                          currentCart
                            .map((cartItem, cartIndex) =>
                              cartIndex === index
                                ? {
                                    ...cartItem,
                                    quantity: cartItem.quantity - 1,
                                  }
                                : cartItem
                            )
                            .filter((cartItem) => cartItem.quantity > 0)
                        );
                      }}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color="#111827"
                      />
                    </Pressable>

                    <Text style={styles.quantityText}>
                      {item.quantity}
                    </Text>

                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => {
                        setCart((currentCart) =>
                          currentCart.map((cartItem, cartIndex) =>
                            cartIndex === index
                              ? {
                                  ...cartItem,
                                  quantity: Math.min(
                                    cartItem.quantity + 1,
                                    cartItem.product.stock || cartItem.quantity + 1
                                  ),
                                }
                              : cartItem
                          )
                        );
                      }}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color="#111827"
                      />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() =>
                      setCart((currentCart) =>
                        currentCart.filter(
                          (_, cartIndex) => cartIndex !== index
                        )
                      )
                    }
                    style={styles.cartDeleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#dc2626"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.cartSummary}>
            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>
                Subtotal
              </Text>
              <Text style={styles.cartSummaryValue}>
                {formatPrice(cartTotal)}
              </Text>
            </View>

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>
                Delivery
              </Text>
              <Text style={styles.cartSummaryValue}>
                Calculated at checkout
              </Text>
            </View>

            <View style={styles.cartSummaryDivider} />

            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartTotalLabel}>
                Total
              </Text>
              <Text style={styles.cartTotalValue}>
                {formatPrice(cartTotal)}
              </Text>
            </View>

            <Pressable
              style={styles.checkoutButton}
              onPress={() => setShowCheckout(true)}
            >
              <Text style={styles.checkoutButtonText}>
                Proceed to Checkout
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#ffffff"
              />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>GAMORA</Text>
          <Text style={styles.tagline}>
            Shop Smart. Live Better.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerIcon}>
            <Ionicons
              name="notifications-outline"
              size={23}
              color="#172033"
            />
          </Pressable>

          <Pressable style={styles.headerIcon}>
            <Ionicons
              name="cart-outline"
              size={24}
              color="#172033"
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#6b7280"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroSmall}>WELCOME TO</Text>
            <Text style={styles.heroTitle}>GAMORA ONLINE</Text>
            <Text style={styles.heroSubtitle}>
              Discover amazing products at great prices.
            </Text>

            <Pressable style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Shop Now</Text>
              <Ionicons
                name="arrow-forward"
                size={17}
                color="#ffffff"
              />
            </Pressable>
          </View>

          <Ionicons
            name="bag-handle-outline"
            size={92}
            color="rgba(255,255,255,0.25)"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#6b7280"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map(([name, icon]) => {
            const active = selectedCategory === name;

            return (
              <Pressable
                key={name}
                onPress={() => setSelectedCategory(name)}
                style={styles.categoryItem}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    active && styles.categoryIconActive,
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={22}
                    color={active ? "#ffffff" : "#1565C0"}
                  />
                </View>

                <Text
                  style={[
                    styles.categoryName,
                    active && styles.categoryNameActive,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#1565C0"
            />
            <Text style={styles.loadingText}>
              Loading products...
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          >
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => setSelectedProduct(product)}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        >
          {newArrivals.map((product) => (
            <ProductCard
              key={`new-${product.id}`}
              product={product}
              onPress={() => setSelectedProduct(product)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All"
              ? "All Products"
              : selectedCategory}
          </Text>

          <Text style={styles.productCount}>
            {filteredProducts.length} products
          </Text>
        </View>

        <View style={styles.grid}>
          {filteredProducts.slice(0, 20).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => setSelectedProduct(product)}
            />
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Ionicons
            name="home"
            size={23}
            color="#1565C0"
          />
          <Text style={[styles.navText, styles.navTextActive]}>
            Home
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Ionicons
            name="grid-outline"
            size={23}
            color="#6b7280"
          />
          <Text style={styles.navText}>
            Categories
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Ionicons
            name="heart-outline"
            size={23}
            color="#6b7280"
          />
          <Text style={styles.navText}>
            Wishlist
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => {
            setSelectedProduct(null);
            setShowCart(true);
          }}
        >
          <View style={styles.cartNavIcon}>
            <Ionicons
              name="cart-outline"
              size={23}
              color="#6b7280"
            />
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>
            Cart
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Ionicons
            name="person-outline"
            size={23}
            color="#6b7280"
          />
          <Text style={styles.navText}>
            Account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  checkoutSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },

  checkoutInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
  },

  locationButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },

  locationCapturedText: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 14,
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },

  paymentOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },

  paymentOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 10,
  },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#1565C0",
  },

  tagline: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },

  headerActions: {
    flexDirection: "row",
    gap: 8,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 15,
    color: "#111827",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  hero: {
    marginHorizontal: 16,
    marginTop: 5,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: "#1565C0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  heroText: {
    flex: 1,
  },

  heroSmall: {
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },

  heroSubtitle: {
    color: "#e0ecff",
    fontSize: 12,
    marginTop: 5,
    maxWidth: 230,
    lineHeight: 17,
  },

  shopButton: {
    marginTop: 13,
    backgroundColor: "#ffffff",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
  },

  shopButtonText: {
    color: "#1565C0",
    fontWeight: "800",
    fontSize: 13,
  },

  sectionHeader: {
    marginTop: 23,
    marginBottom: 11,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#172033",
  },

  viewAll: {
    fontSize: 13,
    color: "#1565C0",
    fontWeight: "700",
  },

  productCount: {
    fontSize: 12,
    color: "#6b7280",
  },

  categoryList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  categoryItem: {
    width: 82,
    alignItems: "center",
  },

  categoryIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#e8f1fc",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIconActive: {
    backgroundColor: "#1565C0",
  },

  categoryName: {
    marginTop: 7,
    fontSize: 11,
    color: "#4b5563",
    textAlign: "center",
    fontWeight: "600",
  },

  categoryNameActive: {
    color: "#1565C0",
    fontWeight: "800",
  },

  productList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  productCard: {
    width: 178,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },

  productImageBox: {
    height: 178,
    backgroundColor: "#ffffff",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  discountBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    backgroundColor: "#dc2626",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  discountText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  heartButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  productInfo: {
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  productName: {
    fontSize: 13,
    lineHeight: 18,
    color: "#172033",
    fontWeight: "600",
    minHeight: 36,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 3,
  },

  ratingText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "700",
  },

  ordersText: {
    fontSize: 10,
    color: "#9ca3af",
  },

  productPrice: {
    marginTop: 5,
    fontSize: 15,
    color: "#1565C0",
    fontWeight: "900",
  },

  oldPrice: {
    marginTop: 2,
    fontSize: 10,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },

  loading: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 9,
    color: "#6b7280",
    fontSize: 13,
  },

  grid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  bottomSpace: {
    height: 85,
  },

  bottomNav: {
    height: 70,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 4,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },

  navText: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
    fontWeight: "600",
  },

  navTextActive: {
    color: "#1565C0",
    fontWeight: "800",
  },
  cartNavIcon: {
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  cartBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  cartScroll: {
    padding: 12,
    paddingBottom: 30,
    backgroundColor: "#f3f4f6",
  },

  cartItem: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  cartImageBox: {
    width: 105,
    height: 105,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },

  cartImage: {
    width: "100%",
    height: "100%",
  },

  cartItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },

  cartItemName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111827",
  },

  cartItemPrice: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "800",
    color: "#1565c0",
  },

  cartVariant: {
    marginTop: 3,
    fontSize: 12,
    color: "#6b7280",
  },

  cartBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  cartDeleteButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
  },

  cartSummary: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },

  cartSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  cartSummaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },

  cartSummaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  cartSummaryDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },

  cartTotalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  cartTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1565c0",
  },

  checkoutButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1565c0",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },

  detailsHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  detailsScroll: {
    paddingBottom: 30,
    backgroundColor: "#f3f4f6",
  },

  detailsImageBox: {
    width: "100%",
    height: 360,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsImage: {
    width: "100%",
    height: "100%",
  },

  detailsContent: {
    backgroundColor: "#ffffff",
    marginTop: 8,
    padding: 18,
  },

  detailsName: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111827",
  },

  detailsPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  detailsPrice: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1565c0",
  },

  detailsOldPrice: {
    fontSize: 16,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },

  detailsMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  detailsCategory: {
    fontSize: 14,
    color: "#6b7280",
  },

  detailsStock: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803d",
  },

  detailsDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
  },

  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  detailsDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#4b5563",
  },

  addToCartButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1565c0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  addToCartText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  variantSection: {
    marginTop: 20,
  },

  variantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  variantOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  variantOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },

  variantOptionSelected: {
    borderColor: "#1565c0",
    backgroundColor: "#1565c0",
  },

  variantOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  variantOptionTextSelected: {
    color: "#ffffff",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },

  quantityText: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

});
