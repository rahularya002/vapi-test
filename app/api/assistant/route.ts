import { NextRequest, NextResponse } from "next/server";
import { ScriptCache } from "@/lib/script-cache";

export async function GET() {
  try {
    // Get the current script from cache (fast, no DB query during calls)
    const config = await ScriptCache.getConfig();
    
    const assistantConfig = {
      name: process.env.ASSISTANT_NAME || "Interview Assistant",
      model: {
        provider: process.env.MODEL_PROVIDER || "openai",
        model: process.env.MODEL_NAME || "gpt-4o-mini",
      },
      voice: {
        provider: config.voice_settings.provider,
        voiceId: config.voice_settings.voice_id,
        speed: config.voice_settings.speed,
        pitch: config.voice_settings.pitch,
      },
      transcription: {
        provider: process.env.TRANSCRIPTION_PROVIDER || "deepgram",
        model: process.env.TRANSCRIPTION_MODEL || "nova-2",
        language: process.env.TRANSCRIPTION_LANGUAGE || "multi",
      },
      initialMessage: {
        role: "system",
        content: config.script.split('\n')[0] || "Hello! This is an automated call regarding your job application."
      },
      instructions: `You are a professional interview assistant conducting phone interviews for job candidates. Follow this script:

${config.script}

Always be professional, friendly, and take notes of their responses. If they ask to speak to a human, explain that this is an automated screening and provide contact information if available.`,
    };

    return NextResponse.json(assistantConfig);
  } catch (error) {
    console.error("Error getting assistant config:", error);
    
    // Fallback to default config if cache fails
    const defaultConfig = ScriptCache.getDefaultConfig();
    
    return NextResponse.json({
      name: "Interview Assistant",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
      },
      voice: {
        provider: defaultConfig.voice_settings.provider,
        voiceId: defaultConfig.voice_settings.voice_id,
        speed: defaultConfig.voice_settings.speed,
        pitch: defaultConfig.voice_settings.pitch,
      },
      transcription: {
        provider: "deepgram",
        model: "nova-2",
        language: "multi",
      },
      initialMessage: {
        role: "system",
        content: "Hello! This is an automated call regarding your job application."
      },
      instructions: `You are a professional interview assistant conducting phone interviews for job candidates. Follow this script:

${defaultConfig.script}

Always be professional, friendly, and take notes of their responses.`,
    });
  }
}

// Update assistant configuration (triggers cache refresh)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Save to database
    const { configApi } = await import("@/lib/supabase");
    await configApi.save(body);
    
    // Refresh cache immediately
    await ScriptCache.refreshConfig();
    
    return NextResponse.json({
      success: true,
      message: "Assistant configuration updated and cache refreshed"
    });
  } catch (error) {
    console.error("Error updating assistant config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}