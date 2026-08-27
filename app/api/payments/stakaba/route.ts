import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { amount, mobileNumber, network, orderId } = body;

    if (!amount || !mobileNumber || !network) {
      return NextResponse.json(
        {
          error: "Amount, mobile number and network are required",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.STAKABA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "STAKABA_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.stakaba.com/api/v1/payments/collection",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          grossAmount: Math.round(Number(amount)),
          currency: "TZS",
          mobileNumber,
          network,
          metadata: {
            orderId: orderId || `GAMORA-${Date.now()}`,
          },
        }),
      }
    );

    const data = await response.json();

console.log("🔥 STAKABA RESPONSE:", {
  status: response.status,
  ok: response.ok,
  data,
});

if (!response.ok) {
  return NextResponse.json(
    {
      error: data?.message || "Payment request failed",
      details: data,
    },
    { status: response.status }
  );
}

    return NextResponse.json(data);
  } catch (error) {
    console.error("Stakaba payment error:", error);

    return NextResponse.json(
      {
        error: "Unable to start payment",
      },
      { status: 500 }
    );
  }
}
