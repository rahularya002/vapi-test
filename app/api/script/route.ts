import { NextRequest, NextResponse } from "next/server";

// In-memory storage for scripts (in production, use a database)
let scripts: any[] = [
  {
    id: 1,
    name: "Basic Interview Script",
    content: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!`,
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Sales Follow-up Script",
    content: `Hi! This is a follow-up call regarding our recent conversation about our services. Do you have a moment to discuss?

1. How are you doing with your current solution?
2. What challenges are you facing?
3. Would you be interested in a demo of our new features?
4. What would be the best time to schedule a meeting?

Thank you for your time!`,
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const script = scripts.find(s => s.id === parseInt(id));
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    return NextResponse.json({ script });
  }

  return NextResponse.json({ scripts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, isDefault = false } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const newScript = {
      id: scripts.length + 1,
      name,
      content,
      isDefault,
      createdAt: new Date().toISOString()
    };

    scripts.push(newScript);

    return NextResponse.json({
      success: true,
      script: newScript,
      message: "Script created successfully"
    });

  } catch (error) {
    console.error("Error creating script:", error);
    return NextResponse.json(
      { error: "Failed to create script" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, content, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    const scriptIndex = scripts.findIndex(s => s.id === parseInt(id));
    if (scriptIndex === -1) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    scripts[scriptIndex] = {
      ...scripts[scriptIndex],
      name: name || scripts[scriptIndex].name,
      content: content || scripts[scriptIndex].content,
      isDefault: isDefault !== undefined ? isDefault : scripts[scriptIndex].isDefault,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      script: scripts[scriptIndex],
      message: "Script updated successfully"
    });

  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    const scriptIndex = scripts.findIndex(s => s.id === parseInt(id));
    if (scriptIndex === -1) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const script = scripts[scriptIndex];
    if (script.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default script" },
        { status: 400 }
      );
    }

    scripts.splice(scriptIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Script deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 }
    );
  }
}
