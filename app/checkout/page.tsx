"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  image?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type GeocodeResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const DELIVERY_RATE_PER_KM = 671;
const MIN_DELIVERY_FEE = 500;

/*
 * Kama una coordinates halisi za Gamora unaweza kuziweka hapa.
 * Mfano:
 *
 * const GAMORA_LOCATION = {
 *   latitude: -6.7924,
 *   longitude: 39.2083,
 * };
 *
 * Kwa sasa mfumo utajaribu kutafuta Gamora automatically.
 */
const GAMORA_LOCATION: Coordinates = {
  latitude: -6.82669,
  longitude: 39.27426,
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");

  const [deliveryMethod, setDeliveryMethod] =
    useState<"delivery" | "pickup">("delivery");

  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [customerLocation, setCustomerLocation] =
    useState<Coordinates | null>(null);

  const [searchedLocationName, setSearchedLocationName] =
    useState("");

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [orderNumber, setOrderNumber] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gamora_cart");

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch {
      setCart([]);
    }
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      return (
        sum +
        Number(item.price) * Number(item.quantity)
      );
    }, 0);
  }, [cart]);

  const total = subtotal + deliveryFee;

  function resetCalculatedLocation() {
    setCustomerLocation(null);
    setSearchedLocationName("");
    setDistanceKm(0);
    setDeliveryFee(0);
    setLocationMessage("");
  }

  function calculateDeliveryFee(distance: number) {
    if (
      !Number.isFinite(distance) ||
      distance <= 0
    ) {
      setDistanceKm(0);
      setDeliveryFee(0);
      return;
    }

    const roundedDistance =
      Math.round(distance * 10) / 10;

    const rawFee =
      roundedDistance * DELIVERY_RATE_PER_KM;

    const roundedFee =
      Math.round(rawFee / 100) * 100;

    setDistanceKm(roundedDistance);

    setDeliveryFee(
      Math.max(
        MIN_DELIVERY_FEE,
        roundedFee
      )
    );
  }

  async function getGamoraLocation(): Promise<Coordinates | null> {
    if (GAMORA_LOCATION) {
      return GAMORA_LOCATION;
    }

    try {
      const query =
         "Gamora, Kariakoo, Dar es Salaam, Tanzania";

      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=1" +
        "&q=" +
        encodeURIComponent(query);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const results =
        (await response.json()) as GeocodeResult[];

      if (!results.length) {
        return null;
      }

      const latitude =
        Number(results[0].lat);

      const longitude =
        Number(results[0].lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    } catch (error) {
      console.error(
        "Gamora geocoding error:",
        error
      );

      return null;
    }
  }

  async function findLocation(
    searchText: string
  ): Promise<{
    coordinates: Coordinates;
    name: string;
  } | null> {
    try {
      const query =
        `${searchText}, Dar es Salaam, Tanzania`;

      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=5" +
        "&addressdetails=1" +
        "&q=" +
        encodeURIComponent(query);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const results =
        (await response.json()) as GeocodeResult[];

      if (!results.length) {
        return null;
      }

      const firstValid = results.find((item) => {
        return (
          Number.isFinite(Number(item.lat)) &&
          Number.isFinite(Number(item.lon))
        );
      });

      if (!firstValid) {
        return null;
      }

      return {
        coordinates: {
          latitude: Number(firstValid.lat),
          longitude: Number(firstValid.lon),
        },
        name: firstValid.display_name,
      };
    } catch (error) {
      console.error(
        "Location search error:",
        error
      );

      return null;
    }
  }

  async function calculateRoadDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<number | null> {
    try {
      const coordinates =
        `${origin.longitude},${origin.latitude};` +
        `${destination.longitude},${destination.latitude}`;

      const url =
        `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
        "?overview=false";

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      const distanceMeters =
        data?.routes?.[0]?.distance;

      if (
        typeof distanceMeters !== "number" ||
        !Number.isFinite(distanceMeters)
      ) {
        return null;
      }

      return distanceMeters / 1000;
    } catch (error) {
      console.error(
        "Road distance error:",
        error
      );

      return null;
    }
  }

  async function searchLocationAndCalculate() {
    const query = address.trim();

    if (!query) {
      alert(
        "Andika location yako kwanza. Mfano: Sinza Madukani"
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage(
      "Inatafuta location na kuhesabu umbali..."
    );

    try {
      const gamora =
        await getGamoraLocation();

      if (!gamora) {
        setLocationMessage("");

        alert(
          "Location ya Gamora haijapatikana kwenye ramani. Weka coordinates halisi za Gamora kwenye GAMORA_LOCATION."
        );

        return;
      }

      const result =
        await findLocation(query);

      if (!result) {
        setLocationMessage("");

        alert(
          `Location "${query}" haijapatikana. Jaribu kuandika jina la eneo kwa usahihi, mfano Sinza Madukani.`
        );

        return;
      }

      const distance =
        await calculateRoadDistance(
          gamora,
          result.coordinates
        );

      if (distance === null) {
        setLocationMessage("");

        alert(
          "Location imepatikana lakini mfumo umeshindwa kupata umbali wa barabara. Jaribu tena."
        );

        return;
      }

      setCustomerLocation(
        result.coordinates
      );

      setSearchedLocationName(
        result.name
      );

      calculateDeliveryFee(distance);

      setLocationMessage(
        `Location imepatikana • ${(Math.round(distance * 10) / 10).toFixed(1)} KM kutoka Gamora`
      );
    } catch (error) {
      console.error(
        "Location calculation error:",
        error
      );

      setLocationMessage("");

      alert(
        "Kuna tatizo wakati wa kutafuta location."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert(
        "Browser yako haisapoti location."
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage(
      "Inatafuta location yako..."
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: Coordinates = {
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        };

        setCustomerLocation(
          coordinates
        );

        setAddress(
          `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
        );

        try {
          const gamora =
            await getGamoraLocation();

          if (!gamora) {
            setLocationMessage("");

            alert(
              "Location ya Gamora haijapatikana kwenye ramani."
            );

            return;
          }

          const distance =
            await calculateRoadDistance(
              gamora,
              coordinates
            );

          if (distance === null) {
            setLocationMessage("");

            alert(
              "Imeshindikana kupata umbali wa barabara."
            );

            return;
          }

          setSearchedLocationName(
            "Location yangu"
          );

          calculateDeliveryFee(distance);

          setLocationMessage(
            `Location yako imepatikana • ${(Math.round(distance * 10) / 10).toFixed(1)} KM kutoka Gamora`
          );
        } catch (error) {
          console.error(
            "GPS calculation error:",
            error
          );

          setLocationMessage("");

          alert(
            "Imeshindikana kuhesabu umbali."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("");

        alert(
          "Imeshindikana kupata location. Ruhusu Location kwenye browser kisha jaribu tena."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }

  function buildFullAddress() {
    return [
      address.trim(),
      area.trim(),
      landmark.trim(),
    ]
      .filter(Boolean)
      .join(", ");
  }

  async function placeOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Weka jina lako.");
      return;
    }

    if (!phone.trim()) {
      alert("Weka namba ya simu.");
      return;
    }

    if (!cart.length) {
      alert("Cart yako haina bidhaa.");
      router.push("/cart");
      return;
    }

    if (
      deliveryMethod === "delivery"
    ) {
      if (!address.trim()) {
        alert(
          "Andika shipping address yako."
        );
        return;
      }

      if (!area.trim()) {
        alert(
          "Andika eneo/mtaa wako."
        );
        return;
      }

      if (
        !customerLocation ||
        distanceKm <= 0
      ) {
        alert(
          "Tafuta location kwanza ili mfumo upate umbali na delivery fee."
        );
        return;
      }
    }

    if (!paymentMethod) {
      alert(
        "Chagua njia ya malipo."
      );
      return;
    }

    setLoading(true);

    const newOrderNumber =
      "GAM-" +
      Date.now()
        .toString()
        .slice(-8);

    const fullAddress =
      deliveryMethod === "pickup"
        ? "Pickup"
        : buildFullAddress();

    const paymentAmount =
      deliveryMethod === "pickup"
        ? subtotal
        : total;

    console.log("CHECKOUT CART:", cart);

    const order = {
      id: newOrderNumber,

      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: fullAddress,
        notes: landmark.trim(),
      },

      location:
        deliveryMethod === "pickup"
          ? null
          : customerLocation,

      distanceKm:
        deliveryMethod === "pickup"
          ? 0
          : distanceKm,

      deliveryFee:
        deliveryMethod === "pickup"
          ? 0
          : deliveryFee,

      deliveryMethod,

      items: cart.map((item) => ({
        ...item,
        image: item.image || "",
      })),

      subtotal,

      discountTotal: 0,

      total: paymentAmount,

      paymentMethod,

      status: "Pending",

      createdAt:
        new Date().toISOString(),
    };

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(order),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to save order"
        );
      }

      if (
        paymentMethod === "M-Pesa" ||
        paymentMethod === "Mix by Yas"
      ) {
        const network =
          paymentMethod === "M-Pesa"
            ? "mpesa"
            : "mixx";

        const paymentResponse =
          await fetch(
            "/api/payments/stakaba",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                amount:
                  paymentAmount,
                mobileNumber:
                  phone,
                network,
                orderId:
                  newOrderNumber,
              }),
            }
          );

        if (!paymentResponse.ok) {
          console.warn(
            "Payment request failed"
          );
        }
      }

      localStorage.removeItem(
        "gamora_cart"
      );

      setOrderNumber(
        newOrderNumber
      );

      setOrderPlaced(true);
    } catch (error) {
      console.error(
        "Order error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Order imeshindikana."
      );
    } finally {
      setLoading(false);
    }
  }

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        
<div className="mt-6 rounded-xl border bg-white p-4 text-sm">
<h3 className="font-bold text-slate-900">Malipo</h3>
<p className="mt-2">MIX BY YAS Lipa: <b>433064356</b></p>
<p>MIX BY YAS Simu: <b>0676285283</b></p>
<p>VODA: <b>0798555221</b></p>
</div>

<div className="mx-auto mt-10 max-w-xl rounded-3xl bg-white p-8 text-center shadow">
          <div className="text-6xl">
            ✅
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Order imepokelewa
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Order yako imewasilishwa
            kikamilifu.
          </p>

          <p className="mt-5 text-sm">
            Order Number
          </p>

          <p className="text-2xl font-black text-sky-700">
            {orderNumber}
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <span>Bidhaa</span>
              <strong>
                TZS{" "}
                {subtotal.toLocaleString()}
              </strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Delivery</span>
              <strong>
                TZS{" "}
                {deliveryFee.toLocaleString()}
              </strong>
            </div>

            {distanceKm > 0 && (
              <div className="mt-2 flex justify-between">
                <span>Umbali</span>
                <strong>
                  {distanceKm.toFixed(1)} KM
                </strong>
              </div>
            )}

            <div className="mt-3 flex justify-between border-t pt-3 text-base font-black">
              <span>Total</span>
              <span className="text-sky-700">
                TZS{" "}
                {total.toLocaleString()}
              </span>
            </div>
          </div>

          <a
            href="/"
            className="mt-7 inline-block rounded-xl bg-sky-700 px-8 py-3 font-bold text-white"
          >
            Rudi Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 pb-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-5 shadow md:p-8">
        <h1 className="text-2xl font-black text-slate-900">
          GAMORA ONLINE Checkout
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Weka taarifa zako ili tukuletee bidhaa.
        </p>
<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <h2 className="mb-3 text-sm font-black text-slate-800">
    🛒 Bidhaa zako
  </h2>

  <div className="space-y-3">
    {cart.map((item) => (
      <div
        key={item.id}
        className="flex items-center justify-between rounded-xl bg-white p-3"
      >
        <div>
          <p className="text-sm font-bold text-slate-800">
            {item.name}
          </p>

          <p className="text-xs text-slate-500">
            Qty: {item.quantity}
          </p>
        </div>

        <p className="text-sm font-black text-sky-700">
          TZS{" "}
          {(
            Number(item.price) *
            Number(item.quantity)
          ).toLocaleString()}
        </p>
      </div>
    ))}
  </div>
</div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Njia ya kupokea bidhaa
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDeliveryMethod(
                  "delivery"
                );
              }}
              className={`rounded-xl border-2 p-3 text-sm font-bold transition ${
                deliveryMethod ===
                "delivery"
                  ? "border-sky-700 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              🚚 Delivery
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryMethod(
                  "pickup"
                );
                setDistanceKm(0);
                setDeliveryFee(0);
                setCustomerLocation(
                  null
                );
              }}
              className={`rounded-xl border-2 p-3 text-sm font-bold transition ${
                deliveryMethod ===
                "pickup"
                  ? "border-sky-700 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              🏪 Pickup
            </button>
          </div>
        </div>

        <form
          onSubmit={placeOrder}
          className="mt-7 space-y-4"
        >
          <input
            required
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
            placeholder="Jina kamili"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            required
            type="tel"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
            placeholder="Namba ya simu"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
          />

          {deliveryMethod ===
            "delivery" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Shipping Address
                </label>

                <textarea
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
                  placeholder="Andika location yako, mfano: Sinza Madukani"
                  value={address}
                  onChange={(e) => {
                    setAddress(
                      e.target.value
                    );
                    resetCalculatedLocation();
                  }}
                />

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={
                      searchLocationAndCalculate
                    }
                    disabled={
                      locationLoading
                    }
                    className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locationLoading
                      ? "⏳ Inatafuta..."
                      : "🔎 Tafuta Location & Hesabu KM"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      useMyLocation
                    }
                    disabled={
                      locationLoading
                    }
                    className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                  >
                    📍 Tumia Location Yangu
                  </button>
                </div>

                {locationMessage && (
                  <div className="mt-3 rounded-xl bg-green-50 p-3">
                    <p className="text-sm font-bold text-green-700">
                      ✅ {locationMessage}
                    </p>
                  </div>
                )}

                {searchedLocationName && (
                  <div className="mt-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-400">
                      LOCATION ILIYOPATIKANA
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {searchedLocationName}
                    </p>
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  Mfano: Sinza Madukani,
                  Mwenge, Kariakoo, Mbezi
                  Beach.
                </p>
              </div>

              <input
                required
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
                placeholder="Mtaa / Eneo / Kata"
                value={area}
                onChange={(e) =>
                  setArea(e.target.value)
                }
              />

              <input
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
                placeholder="Landmark (mfano: karibu na...)"
                value={landmark}
                onChange={(e) =>
                  setLandmark(
                    e.target.value
                  )
                }
              />

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-sky-800">
                      📍 Delivery Estimate
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Mfumo unakadiria umbali
                      wa barabara automatically.
                    </p>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700">
                    TZS 671/KM
                  </div>
                </div>

                {distanceKm > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-bold text-slate-400">
                        UMBALI
                      </p>

                      <p className="mt-1 text-2xl font-black text-sky-700">
                        {distanceKm.toFixed(
                          1
                        )}
                        <span className="ml-1 text-sm">
                          KM
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-bold text-slate-400">
                        DELIVERY
                      </p>

                      <p className="mt-1 text-2xl font-black text-sky-700">
                        {deliveryFee.toLocaleString()}
                        <span className="ml-1 text-sm">
                          TZS
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-white p-4 text-center">
                    <p className="text-sm font-bold text-slate-500">
                      Andika location hapo juu
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      kisha bonyeza
                      <strong>
                        {" "}
                        Tafuta Location & Hesabu KM
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <select
            required
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-sky-700"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          >
            <option value="">
              Chagua njia ya malipo
            </option>

            <option value="M-Pesa">
              M-Pesa
            </option>

            <option value="Mix by Yas">
              Mix by Yas
            </option>

            <option value="Cash">
              Cash
            </option>
          </select>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Bidhaa
              </span>

              <span className="font-bold text-slate-800">
                TZS{" "}
                {subtotal.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">
                Delivery
              </span>

              <span className="font-bold text-slate-800">
                TZS{" "}
                {deliveryFee.toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-black">
              <span>Total</span>

              <span className="text-sky-700">
                TZS{" "}
                {total.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-700 p-4 font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Inaweka Order..."
              : "Weka Order"}
          </button>
        </form>
      </div>
    </main>
  );
}
