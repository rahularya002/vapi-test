import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const config = {
      VAPI_PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
      VAPI_PUBLIC_KEY: process.env.VAPI_PUBLIC_KEY ? "✅ Set" : "❌ Missing",
      VAPI_PHONE_NUMBER_ID: process.env.VAPI_PHONE_NUMBER_ID ? "✅ Set" : "❌ Missing",
      VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID ? "✅ Set" : "❌ Missing",
    };

    const missing = Object.entries(config)
      .filter(([_, status]) => status.includes("❌"))
      .map(([key, _]) => key);

    return NextResponse.json({
      success: missing.length === 0,
      config,
      missing,
      message: missing.length === 0 
        ? "All Vapi credentials are configured" 
        : `Missing: ${missing.join(", ")}`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
