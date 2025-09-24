import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export async function GET(request: NextRequest) {
  try {
    // Check if credentials are configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json({
        success: false,
        error: "Twilio credentials not configured",
        missing: {
          accountSid: !TWILIO_ACCOUNT_SID,
          authToken: !TWILIO_AUTH_TOKEN,
          phoneNumber: !TWILIO_PHONE_NUMBER
        }
      }, { status: 500 });
    }

    // Test Twilio connection
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    // Get account information
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    
    // Get verified caller IDs
    const verifiedNumbers = await client.outgoingCallerIds.list();
    
    // Get phone number details
    const phoneNumber = await client.incomingPhoneNumbers.list({ phoneNumber: TWILIO_PHONE_NUMBER });
    
    return NextResponse.json({
      success: true,
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      },
      phoneNumber: {
        number: TWILIO_PHONE_NUMBER,
        found: phoneNumber.length > 0,
        capabilities: phoneNumber.length > 0 ? phoneNumber[0].capabilities : null
      },
      verifiedNumbers: {
        count: verifiedNumbers.length,
        numbers: verifiedNumbers.map(num => ({
          phoneNumber: num.phoneNumber,
          friendlyName: num.friendlyName,
          dateCreated: num.dateCreated
        }))
      },
      message: "Twilio connection successful"
    });

  } catch (error: any) {
    console.error("Twilio test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to connect to Twilio",
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
}
