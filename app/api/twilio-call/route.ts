import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL || "https://yourdomain.com/api/vapi-webhook";

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

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Create a TwiML response that connects to Vapi
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference>vapi-interview-${Date.now()}</Conference>
  </Dial>
</Response>`;

    // Alternative approach: Use Twilio's <Connect> with Vapi webhook
    const twimlWithConnect = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.vapi.ai/stream" />
  </Connect>
</Response>`;

    // For now, we'll use a simpler approach with TwiML that can be extended
    // This creates a call that can be connected to Vapi via webhook
    const client = getTwilioClient();
    const call = await client.calls.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      twiml: `<Response><Say>Hello ${candidateName || 'there'}, this is an automated call regarding your job application. Please hold while we connect you to our interview system.</Say><Pause length="2"/><Say>Connecting you now...</Say></Response>`,
      statusCallback: `${VAPI_WEBHOOK_URL}?callType=twilio&candidateName=${encodeURIComponent(candidateName || '')}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Twilio call initiated successfully"
    });

  } catch (error) {
    console.error("Error initiating Twilio call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}

// Get call status from Twilio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callSid = searchParams.get("callSid");

    if (!callSid) {
      return NextResponse.json(
        { error: "Call SID is required" },
        { status: 400 }
      );
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    const client = getTwilioClient();
    const call = await client.calls(callSid).fetch();

    return NextResponse.json({
      success: true,
      call: {
        sid: call.sid,
        status: call.status,
        direction: call.direction,
        from: call.from,
        to: call.to,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.duration
      }
    });

  } catch (error) {
    console.error("Error getting call status:", error);
    return NextResponse.json(
      { error: "Failed to get call status" },
      { status: 500 }
    );
  }
}
