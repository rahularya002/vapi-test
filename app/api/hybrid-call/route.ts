import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
        { error: "Vapi credentials not configured" },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Step 1: Create a Vapi call first
    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistantId: assistantId || VAPI_ASSISTANT_ID,
        customer: {
          number: phoneNumber,
          name: candidateName || "Candidate"
        },
        metadata: {
          candidateName,
          callType: "interview",
          timestamp: new Date().toISOString()
        }
      })
    });

    const vapiResult = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error("Vapi call creation failed:", vapiResult);
      return NextResponse.json(
        { error: `Vapi call failed: ${vapiResult.message || "Unknown error"}` },
        { status: vapiResponse.status }
      );
    }

    // Step 2: Use Twilio to make the actual call and connect to Vapi
    // This approach uses Twilio's outbound calling with Vapi's AI
    const call = await client.calls.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      twiml: `<Response>
        <Say voice="alice">Hello ${candidateName || 'there'}, this is an automated call regarding your job application. Please hold while we connect you to our interview system.</Say>
        <Pause length="2"/>
        <Say voice="alice">Connecting you now...</Say>
        <Redirect>https://api.vapi.ai/call/${vapiResult.id}/connect</Redirect>
      </Response>`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/vapi-webhook?callType=hybrid&vapiCallId=${vapiResult.id}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return NextResponse.json({
      success: true,
      twilioCallSid: call.sid,
      vapiCallId: vapiResult.id,
      status: call.status,
      message: "Hybrid call initiated successfully (Twilio + Vapi)"
    });

  } catch (error) {
    console.error("Error initiating hybrid call:", error);
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

    const call = await client.calls.create({
      to: phoneNumber,
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
      message: "Twilio call initiated with basic interview flow"
    });

  } catch (error) {
    console.error("Error initiating Twilio call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
