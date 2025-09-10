import { NextResponse } from "next/server";

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
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Vapi Webhook] Error parsing body", error);
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}
}

export function GET() {
	return NextResponse.json({ status: "vapi-webhook-ok" });
}


