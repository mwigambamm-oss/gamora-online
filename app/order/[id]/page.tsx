import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id?: number;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
};

type Order = {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_method: string;
  items: OrderItem[];
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
};

function money(value: number) {
  return `TZS ${Number(value || 0).toLocaleString("en-TZ")}`;
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "order_number,customer_name,customer_phone,customer_address,delivery_method,items,subtotal,discount_total,delivery_fee,total,status,created_at"
    )
    .eq("order_number", id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const items = Array.isArray(order.items)
    ? (order.items as OrderItem[])
    : [];

  const date = new Date(order.created_at);

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <header className="border-b px-6 py-6 text-center">
          <img
            src="/gamora-logo.png"
            alt="Gamora Online"
            className="mx-auto h-20 w-20 object-contain"
          />

          <h1 className="mt-2 text-2xl font-bold tracking-wide text-[#111]">
            GAMORA ONLINE
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your Online Marketplace
          </p>

          <div className="mt-5 inline-block rounded-full bg-[#fbeaec] px-5 py-2">
            <p className="text-sm font-bold text-[#E30613]">
              ORDER VERIFIED
            </p>
          </div>
        </header>

        <section className="px-6 py-6">
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-gray-500">Order Number</p>
              <p className="mt-1 font-bold text-[#111]">
                {order.order_number}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Date</p>
              <p className="mt-1 font-semibold text-[#111]">
                {date.toLocaleDateString("en-GB")}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Customer</p>
              <p className="mt-1 font-semibold text-[#111]">
                {order.customer_name}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="mt-1 font-semibold text-[#111]">
                {order.customer_phone}
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-gray-500">Delivery</p>
              <p className="mt-1 font-semibold text-[#111]">
                {order.delivery_method === "pickup"
                  ? "Pickup"
                  : order.customer_address || "Delivery"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Payment Status</p>
              <p className="mt-1 font-bold text-[#E30613]">
                PENDING
              </p>
            </div>

            <div>
              <p className="text-gray-500">Order Status</p>
              <p className="mt-1 font-bold text-[#E30613]">
                {order.status}
              </p>
            </div>
          </div>

          <h2 className="mt-7 mb-3 text-lg font-bold text-[#111]">
            Order Items
          </h2>

          <div className="divide-y rounded-xl border">
            {items.map((item, index) => {
              const quantity = Number(item.quantity || 0);
              const price = Number(item.price || 0);

              return (
                <div
                  key={`${item.id || "item"}-${index}`}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111]">
                      {item.name || "Product"}
                    </p>

                    {(item.selectedColor ||
                      item.selectedSize) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.selectedColor
                          ? `Colour: ${item.selectedColor}`
                          : ""}
                        {item.selectedColor &&
                        item.selectedSize
                          ? " • "
                          : ""}
                        {item.selectedSize
                          ? `Size: ${item.selectedSize}`
                          : ""}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-gray-500">
                      Qty: {quantity}
                    </p>
                  </div>

                  <p className="shrink-0 font-bold text-[#111]">
                    {money(price * quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">
                {money(Number(order.subtotal))}
              </span>
            </div>

            {Number(order.discount_total) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold">
                  -{money(Number(order.discount_total))}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-500">
                Delivery Fee
              </span>
              <span className="font-semibold">
                {money(Number(order.delivery_fee))}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">
                  TOTAL
                </span>
                <span className="text-xl font-bold text-[#E30613]">
                  {money(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed p-5 text-center">
            <p className="text-sm font-semibold text-[#111]">
              This order reference is valid on Gamora Online.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {order.order_number}
            </p>
          </div>
        </section>

        <footer className="border-t px-6 py-5 text-center text-xs text-gray-500">
          Thank you for shopping with GAMORA ONLINE.
          <br />
          gamoraonline.co.tz
        </footer>
      </div>
    </main>
  );
}
