import { NextRequest, NextResponse } from "next/server";

const VAPI_API_URL = "https://api.vapi.ai/call";
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, candidateName, assistantId } = body;

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Prepare the call request
    const callRequest = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID, // Your Vapi phone number ID
      customer: {
        number: phoneNumber,
        name: candidateName || "Candidate"
      },
      assistantId: assistantId || process.env.VAPI_ASSISTANT_ID,
      // Optional: Add custom data for the call
      customerId: `candidate_${Date.now()}`,
      metadata: {
        candidateName,
        callType: "interview",
        timestamp: new Date().toISOString()
      }
    };

    // Make the call via Vapi API
    const response = await fetch(VAPI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(callRequest)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Vapi API error:", result);
      return NextResponse.json(
        { error: result.message || "Failed to initiate call" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      callId: result.id,
      status: result.status,
      message: "Call initiated successfully"
    });

  } catch (error) {
    console.error("Error initiating call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}

// Get call status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${VAPI_API_URL}/${callId}`, {
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to get call status" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      call: result
    });

  } catch (error) {
    console.error("Error getting call status:", error);
    return NextResponse.json(
      { error: "Failed to get call status" },
      { status: 500 }
    );
  }
}
