import { NextRequest, NextResponse } from "next/server";

const AVNU_PAYMASTER_MAINNET = "https://starknet.paymaster.avnu.fi";
const AVNU_PAYMASTER_SEPOLIA = "https://sepolia.paymaster.avnu.fi";

export async function POST(request: NextRequest) {
  console.log("[Paymaster API] Request received");

  try {
    const apiKey = process.env.AVNU_PAYMASTER_API_KEY;

    if (!apiKey) {
      console.error("[Paymaster API] No API key configured");
      return NextResponse.json(
        { error: "Paymaster not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    console.log("[Paymaster API] Request body method:", body.method);

    // Use sepolia for testing, mainnet for production
    const paymasterUrl =
      process.env.NEXT_PUBLIC_STARKNET_NETWORK === "sepolia"
        ? AVNU_PAYMASTER_SEPOLIA
        : AVNU_PAYMASTER_MAINNET;

    console.log("[Paymaster API] Forwarding to:", paymasterUrl);

    const response = await fetch(paymasterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paymaster-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Paymaster API] Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Paymaster request failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Paymaster API] Success, response:", JSON.stringify(data).slice(0, 200));
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Paymaster API] Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
