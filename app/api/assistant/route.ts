import { NextResponse } from "next/server";

// Simple Vapi assistant config that opens by asking for English/Hindi
export async function GET() {
	const assistantConfig = {
		name: process.env.ASSISTANT_NAME || "Language Preference Agent",
		model: {
			provider: process.env.MODEL_PROVIDER || "openai",
			model: process.env.MODEL_NAME || "gpt-4o-mini",
		},
		voice: {
			provider: process.env.VOICE_PROVIDER || "elevenlabs",
			voiceId: process.env.VOICE_ID || "adam",
		},
		transcription: {
			provider: process.env.TRANSCRIPTION_PROVIDER || "deepgram",
			model: process.env.TRANSCRIPTION_MODEL || "nova-2",
			language: process.env.TRANSCRIPTION_LANGUAGE || "multi",
		},
		initialMessage: {
			role: "system",
			content:
				process.env.INITIAL_MESSAGE ||
				"Hello! I can speak English or Hindi. Which language would you prefer?",
		},
		instructions:
			process.env.INSTRUCTIONS ||
			"You are a friendly assistant that can converse in English and Hindi. After the caller states a preference, continue the conversation in that language. If unclear, briefly ask again.",
	};

	return NextResponse.json(assistantConfig);
}


