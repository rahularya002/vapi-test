import { NextRequest, NextResponse } from "next/server";

// In-memory storage (in production, use a database)
let callQueue: any[] = [];
let callHistory: any[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "queue";

  if (type === "history") {
    return NextResponse.json({ calls: callHistory });
  }

  return NextResponse.json({ 
    queue: callQueue,
    total: callQueue.length 
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, candidateId, callResult, callNotes } = body;

    switch (action) {
      case "add_to_queue":
        const { candidates } = body;
        if (!Array.isArray(candidates)) {
          return NextResponse.json({ error: "Candidates must be an array" }, { status: 400 });
        }
        
        // Add candidates to queue
        candidates.forEach((candidate: any) => {
          const existingIndex = callQueue.findIndex(c => c.id === candidate.id);
          if (existingIndex === -1) {
            callQueue.push({
              ...candidate,
              status: "pending",
              addedAt: new Date().toISOString()
            });
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          message: `Added ${candidates.length} candidates to call queue`,
          queueLength: callQueue.length
        });

      case "start_call":
        const candidate = callQueue.find(c => c.id === candidateId);
        if (!candidate) {
          return NextResponse.json({ error: "Candidate not found in queue" }, { status: 404 });
        }

        // Update candidate status
        candidate.status = "calling";
        candidate.callStartTime = new Date().toISOString();

        return NextResponse.json({ 
          success: true, 
          candidate,
          message: "Call started"
        });

      case "end_call":
        const candidateToUpdate = callQueue.find(c => c.id === candidateId);
        if (!candidateToUpdate) {
          return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        // Update candidate with call result
        candidateToUpdate.status = "completed";
        candidateToUpdate.callResult = callResult;
        candidateToUpdate.callNotes = callNotes;
        candidateToUpdate.callEndTime = new Date().toISOString();

        // Move to history and remove from queue
        callHistory.push({ ...candidateToUpdate });
        callQueue = callQueue.filter(c => c.id !== candidateId);

        return NextResponse.json({ 
          success: true, 
          message: "Call completed and moved to history"
        });

      case "clear_queue":
        callQueue = [];
        return NextResponse.json({ 
          success: true, 
          message: "Call queue cleared"
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in call management:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
