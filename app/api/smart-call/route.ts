import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_API_URL = "https://api.vapi.ai/call";

// Initialize Twilio client only when needed
const getTwilioClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, candidateName, assistantId, preferVapi = false } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format and validate phone number for E.164 format
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { 
          error: `Invalid phone number: ${phoneValidation.error}`,
          formatted: phoneValidation.formatted,
          original: phoneNumber
        },
        { status: 400 }
      );
    }

    const formattedPhone = phoneValidation.formatted;

    // If Vapi is preferred or Twilio is not configured, try Vapi first
    if (preferVapi || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return await tryVapiCall(formattedPhone, candidateName, assistantId);
    }

    // Try Twilio first, fallback to Vapi if it fails
    try {
      return await tryTwilioCall(formattedPhone, candidateName, assistantId);
    } catch (twilioError: any) {
      console.log("Twilio call failed, trying Vapi fallback:", twilioError.message);
      
      // If Twilio fails due to trial account limitations, try Vapi
      if (twilioError.code === 21219 || twilioError.code === 21211) {
        return await tryVapiCall(formattedPhone, candidateName, assistantId, "Twilio trial account limitation");
      }
      
      // For other Twilio errors, still try Vapi as fallback
      return await tryVapiCall(formattedPhone, candidateName, assistantId, twilioError.message);
    }

  } catch (error: any) {
    console.error("Error in smart call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call with both Twilio and Vapi" },
      { status: 500 }
    );
  }
}

async function tryTwilioCall(phoneNumber: string, candidateName?: string, assistantId?: string) {
  const client = getTwilioClient();
  
  // Create a TwiML that provides a basic interview experience
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello ${candidateName || 'there'}, this is an automated call regarding your job application.</Say>
  <Pause length="1"/>
  <Say voice="alice">Do you have a few minutes to answer some questions?</Say>
  <Gather numDigits="1" action="/api/call-response" method="POST" timeout="10">
    <Say voice="alice">Press 1 for yes, or 2 for no.</Say>
  </Gather>
  <Say voice="alice">I didn't hear a response. Please call back when you're available. Goodbye.</Say>
</Response>`;

  const call = await client.calls.create({
    to: phoneNumber,
    from: TWILIO_PHONE_NUMBER!,
    twiml: twiml,
    statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/vapi-webhook?callType=twilio`,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST'
  });

  return NextResponse.json({
    success: true,
    provider: "twilio",
    callId: call.sid,
    status: call.status,
    message: "Call initiated successfully with Twilio"
  });
}

async function tryVapiCall(phoneNumber: string, candidateName?: string, assistantId?: string, fallbackReason?: string) {
  if (!VAPI_PRIVATE_KEY || !VAPI_ASSISTANT_ID || !process.env.VAPI_PHONE_NUMBER_ID) {
    throw new Error("Vapi credentials not configured. Missing VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID, or VAPI_PHONE_NUMBER_ID");
  }

  // Prepare the call request
  const callRequest = {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    customer: {
      number: phoneNumber,
      name: candidateName || "Candidate"
    },
    assistantId: assistantId || VAPI_ASSISTANT_ID,
    customerId: `candidate_${Date.now()}`,
    metadata: {
      candidateName,
      callType: "interview",
      timestamp: new Date().toISOString(),
      fallbackReason
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
    throw new Error(result.message || "Failed to initiate Vapi call");
  }

  return NextResponse.json({
    success: true,
    provider: "vapi",
    callId: result.id,
    status: result.status,
    message: fallbackReason 
      ? `Call initiated with Vapi (fallback from Twilio: ${fallbackReason})`
      : "Call initiated successfully with Vapi"
  });
}
