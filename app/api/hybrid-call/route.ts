import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

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
    const { phoneNumber, candidateName, assistantId } = body;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    if (!VAPI_PRIVATE_KEY || !VAPI_ASSISTANT_ID) {
      return NextResponse.json(
        { error: "Vapi credentials not configured. Missing VAPI_PRIVATE_KEY or VAPI_ASSISTANT_ID" },
        { status: 500 }
      );
    }

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

    // Use Twilio to make the call with a TwiML that handles the conversation
    // This approach uses Twilio for the call and a simple TwiML for basic interaction
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
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      twiml: twiml,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/vapi-webhook?callType=hybrid`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return NextResponse.json({
      success: true,
      twilioCallSid: call.sid,
      status: call.status,
      message: "Hybrid call initiated successfully (Twilio with basic interview flow)",
      provider: "twilio",
      callType: "hybrid"
    });

  } catch (error: any) {
    console.error("Error initiating hybrid call:", error);
    
    // Handle Twilio trial account limitations
    if (error.code === 21219) {
      return NextResponse.json(
        { 
          error: "Phone number not verified. Trial accounts can only call verified numbers.",
          code: error.code,
          details: "Please verify the phone number in your Twilio console or upgrade your account.",
          suggestion: "Try using the Vapi-only call endpoint instead: /api/vapi-call"
        },
        { status: 400 }
      );
    }
    
    // Handle other Twilio errors
    if (error.code && error.moreInfo) {
      return NextResponse.json(
        { 
          error: error.message || "Twilio API error",
          code: error.code,
          details: error.details,
          moreInfo: error.moreInfo
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}

// Alternative approach: Use Twilio to call and then transfer to Vapi
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, candidateName, assistantId } = body;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

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

    // Create a TwiML that will handle the call flow
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

    const client = getTwilioClient();
    const call = await client.calls.create({
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      twiml: twiml,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/vapi-webhook?callType=twilio-only`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Twilio call initiated with basic interview flow",
      provider: "twilio",
      callType: "twilio-only"
    });

  } catch (error: any) {
    console.error("Error initiating Twilio call:", error);
    
    // Handle Twilio trial account limitations
    if (error.code === 21219) {
      return NextResponse.json(
        { 
          error: "Phone number not verified. Trial accounts can only call verified numbers.",
          code: error.code,
          details: "Please verify the phone number in your Twilio console or upgrade your account.",
          suggestion: "Try using the Vapi-only call endpoint instead: /api/vapi-call"
        },
        { status: 400 }
      );
    }
    
    // Handle other Twilio errors
    if (error.code && error.moreInfo) {
      return NextResponse.json(
        { 
          error: error.message || "Twilio API error",
          code: error.code,
          details: error.details,
          moreInfo: error.moreInfo
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
