import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

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
    const { phoneNumber, candidateName } = body;

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

    // Create a comprehensive TwiML for the interview
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
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/vapi-webhook?callType=twilio-only`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Twilio call initiated successfully with interview flow"
    });

  } catch (error) {
    console.error("Error initiating Twilio call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
