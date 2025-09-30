import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
	// Optional simple bearer token check to prevent random posts
	const authHeader = request.headers.get("authorization") || "";
	const expected = process.env.WEBHOOK_SECRET;
	if (expected) {
		const provided = authHeader.replace(/^Bearer\s+/i, "");
		if (!provided || provided !== expected) {
			return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
		}
	}
	
	try {
		const body = await request.json();
		console.log("[Vapi Webhook] Event:", {
			type: body?.type,
			callId: body?.callId,
			dataKeys: body ? Object.keys(body) : [],
		});

		// Handle different webhook events
		switch (body?.type) {
			case "call-started":
				await handleCallStarted(body);
				break;
			case "call-ended":
				await handleCallEnded(body);
				break;
			case "assistant-message":
				await handleAssistantMessage(body);
				break;
			case "user-message":
				await handleUserMessage(body);
				break;
			case "function-call":
				await handleFunctionCall(body);
				break;
			case "call-analysis":
				await handleCallAnalysis(body);
				break;
			default:
				console.log("[Vapi Webhook] Unhandled event type:", body?.type);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Vapi Webhook] Error parsing body", error);
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}
}

async function handleCallStarted(event: any) {
	console.log("[Vapi Webhook] Call started:", event.callId);
	
	// Update call status in database
	if (supabase && event.callId) {
		try {
			await supabase
				.from('calls')
				.update({ 
					status: 'calling',
					call_start_time: new Date().toISOString(),
					vapi_call_id: event.callId
				})
				.eq('vapi_call_id', event.callId);
		} catch (error) {
			console.error("Error updating call status:", error);
		}
	}
}

async function handleCallEnded(event: any) {
	console.log("[Vapi Webhook] Call ended:", event.callId);
	
	// Update call status and save results
	if (supabase && event.callId) {
		try {
			await supabase
				.from('calls')
				.update({ 
					status: 'completed',
					call_end_time: new Date().toISOString(),
					call_duration: event.duration,
					call_summary: event.summary,
					call_transcript: event.transcript
				})
				.eq('vapi_call_id', event.callId);
		} catch (error) {
			console.error("Error updating call end status:", error);
		}
	}
}

async function handleAssistantMessage(event: any) {
	console.log("[Vapi Webhook] Assistant message:", event.message);
	// Log assistant responses for debugging
}

async function handleUserMessage(event: any) {
	console.log("[Vapi Webhook] User message:", event.message);
	// Log user responses for debugging
}

async function handleFunctionCall(event: any) {
	console.log("[Vapi Webhook] Function call:", event.functionCall);
	
	// Handle specific function calls from the assistant
	if (event.functionCall?.name === "take_notes") {
		await handleTakeNotes(event.functionCall.parameters, event.callId);
	} else if (event.functionCall?.name === "schedule_follow_up") {
		await handleScheduleFollowUp(event.functionCall.parameters, event.callId);
	}
}

async function handleCallAnalysis(event: any) {
	console.log("[Vapi Webhook] Call analysis:", event.analysis);
	
	// Save call analysis results
	if (supabase && event.callId) {
		try {
			await supabase
				.from('calls')
				.update({ 
					call_analysis: event.analysis,
					sentiment: event.analysis?.sentiment,
					key_topics: event.analysis?.topics
				})
				.eq('vapi_call_id', event.callId);
		} catch (error) {
			console.error("Error saving call analysis:", error);
		}
	}
}

async function handleTakeNotes(parameters: any, callId: string) {
	console.log("[Vapi Webhook] Taking notes:", parameters);
	
	// Save notes to database
	if (supabase && callId) {
		try {
			await supabase
				.from('call_notes')
				.insert({
					call_id: callId,
					question: parameters.question,
					response: parameters.response,
					key_points: parameters.key_points,
					created_at: new Date().toISOString()
				});
		} catch (error) {
			console.error("Error saving notes:", error);
		}
	}
}

async function handleScheduleFollowUp(parameters: any, callId: string) {
	console.log("[Vapi Webhook] Scheduling follow-up:", parameters);
	
	// Save follow-up request to database
	if (supabase && callId) {
		try {
			await supabase
				.from('follow_ups')
				.insert({
					call_id: callId,
					candidate_name: parameters.candidate_name,
					preferred_time: parameters.preferred_time,
					reason: parameters.reason,
					status: 'pending',
					created_at: new Date().toISOString()
				});
		} catch (error) {
			console.error("Error saving follow-up:", error);
		}
	}
}

export function GET() {
	return NextResponse.json({ status: "vapi-webhook-ok" });
}


