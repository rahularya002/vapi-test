import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
    const VAPI_PUBLIC_KEY = process.env.VAPI_PUBLIC_KEY;
    const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
    const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

    // Check if keys are present
    const keyStatus = {
      VAPI_PRIVATE_KEY: VAPI_PRIVATE_KEY ? "✅ Present" : "❌ Missing",
      VAPI_PUBLIC_KEY: VAPI_PUBLIC_KEY ? "✅ Present" : "❌ Missing", 
      VAPI_PHONE_NUMBER_ID: VAPI_PHONE_NUMBER_ID ? "✅ Present" : "❌ Missing",
      VAPI_ASSISTANT_ID: VAPI_ASSISTANT_ID ? "✅ Present" : "❌ Missing"
    };

    // Test Vapi API connection
    let apiTest = "Not tested";
    let apiError = null;

    if (VAPI_PRIVATE_KEY) {
      try {
        const response = await fetch("https://api.vapi.ai/assistant", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          apiTest = `✅ Success - Found ${data.length || 0} assistants`;
        } else {
          const errorData = await response.json();
          apiTest = `❌ Failed - ${response.status}: ${errorData.message || 'Unknown error'}`;
          apiError = errorData;
        }
      } catch (error) {
        apiTest = `❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`;
        apiError = error;
      }
    }

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Present" : "❌ Missing"
      },
      vapiKeys: keyStatus,
      apiTest,
      apiError,
      recommendations: getRecommendations(keyStatus, apiTest)
    });

  } catch (error) {
    console.error("Vapi test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function getRecommendations(keyStatus: any, apiTest: string) {
  const recommendations = [];

  if (!keyStatus.VAPI_PRIVATE_KEY.includes("✅")) {
    recommendations.push("Add VAPI_PRIVATE_KEY to your .env.local file");
  }

  if (!keyStatus.VAPI_PUBLIC_KEY.includes("✅")) {
    recommendations.push("Add VAPI_PUBLIC_KEY to your .env.local file");
  }

  if (!keyStatus.VAPI_PHONE_NUMBER_ID.includes("✅")) {
    recommendations.push("Add VAPI_PHONE_NUMBER_ID to your .env.local file");
  }

  if (!keyStatus.VAPI_ASSISTANT_ID.includes("✅")) {
    recommendations.push("Add VAPI_ASSISTANT_ID to your .env.local file");
  }

  if (apiTest.includes("❌")) {
    if (apiTest.includes("401")) {
      recommendations.push("VAPI_PRIVATE_KEY is invalid - check your Vapi dashboard");
    } else if (apiTest.includes("403")) {
      recommendations.push("VAPI_PRIVATE_KEY doesn't have required permissions");
    } else if (apiTest.includes("404")) {
      recommendations.push("Vapi API endpoint not found - check API version");
    } else {
      recommendations.push("Check your internet connection and Vapi service status");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("All Vapi keys are configured correctly!");
  }

  return recommendations;
}
