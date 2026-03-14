import { NextRequest, NextResponse } from "next/server";
import { getAllCalls, createCall, endCall } from "@/lib/db";

export async function GET() {
  try {
    const calls = getAllCalls();
    return NextResponse.json({ calls });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    if (action === "create") {
      const call = createCall(id);
      return NextResponse.json({ call });
    }

    if (action === "end") {
      const call = endCall(id, data);
      return NextResponse.json({ call });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with call:", error);
    return NextResponse.json(
      { error: "Failed to process call" },
      { status: 500 }
    );
  }
}
