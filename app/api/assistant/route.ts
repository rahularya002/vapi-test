import { NextResponse } from "next/server";

// Vapi assistant config for candidate interview calls
export async function GET() {
	const assistantConfig = {
		name: process.env.ASSISTANT_NAME || "Interview Assistant",
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
				"Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?",
		},
		instructions:
			process.env.INSTRUCTIONS ||
			`You are a professional interview assistant conducting phone interviews for job candidates. Follow this script:

1. Greet the candidate warmly and confirm their identity
2. Explain this is an automated interview call
3. Ask if they have 10-15 minutes for the interview
4. If yes, proceed with these questions:
   - Can you tell me about yourself and your background?
   - What interests you about this position?
   - What are your key strengths and skills?
   - Do you have any questions about the role or company?
   - What is your availability for the next steps?

5. Be professional, friendly, and take notes of their responses
6. Thank them for their time and explain next steps
7. If they decline or seem uninterested, politely end the call

Always be respectful of their time and maintain a professional tone. If they ask to speak to a human, explain that this is an automated screening and provide contact information if available.`,
	};

	return NextResponse.json(assistantConfig);
}


