import { NextRequest, NextResponse } from "next/server";
import { ScriptCache } from "@/lib/script-cache";
import { configApi } from "@/lib/supabase";

export async function GET() {
  try {
    const config = await ScriptCache.getConfig();
    return NextResponse.json({
      success: true,
      script: config.script,
      voiceSettings: config.voice_settings,
      callSettings: config.call_settings,
      method: config.method
    });
  } catch (error) {
    console.error("Error getting script:", error);
    return NextResponse.json(
      { error: "Failed to get script" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script, voiceSettings, callSettings, method } = body;

    if (!script) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Update configuration in database
    const updatedConfig = {
      method: method || 'hybrid',
      script,
      voice_settings: voiceSettings || {
        provider: 'elevenlabs',
        voice_id: 'adam',
        speed: 1.0,
        pitch: 1.0
      },
      call_settings: callSettings || {
        max_duration: 15,
        retry_attempts: 2,
        delay_between_calls: 30
      }
    };

    await configApi.save(updatedConfig);
    
    // Refresh cache immediately so new calls use updated script
    await ScriptCache.refreshConfig();

    return NextResponse.json({
      success: true,
      message: "Script updated successfully. New calls will use the updated script immediately.",
      config: updatedConfig
    });

  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
      { status: 500 }
    );
  }
}

// Get available script templates
export async function PUT() {
  const templates = [
    {
      name: "Basic Interview",
      script: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!`
    },
    {
      name: "Technical Interview",
      script: `Hello! This is a technical screening call for the position you applied for. Do you have 15-20 minutes for some technical questions?

1. Can you walk me through your technical background?
2. What programming languages are you most comfortable with?
3. Describe a challenging technical problem you solved recently.
4. How do you stay updated with new technologies?
5. Do you have any questions about our tech stack?

Thank you for your time!`
    },
    {
      name: "Sales Interview",
      script: `Hello! This is a call regarding your application for our sales position. Do you have a few minutes to discuss your experience?

1. Tell me about your sales experience and achievements.
2. How do you approach cold calling and lead generation?
3. Describe a time you overcame a difficult objection.
4. What's your approach to building long-term client relationships?
5. What questions do you have about our sales process?

Thank you for your time!`
    },
    {
      name: "Customer Service",
      script: `Hello! This is a call about your application for our customer service role. Do you have a few minutes to answer some questions?

1. Tell me about your customer service experience.
2. How do you handle difficult or angry customers?
3. Describe a time you went above and beyond for a customer.
4. What do you think makes great customer service?
5. Do you have any questions about our service standards?

Thank you for your time!`
    }
  ];

  return NextResponse.json({
    success: true,
    templates
  });
}