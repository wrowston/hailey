import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "xAI API key not configured. Set XAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.x.ai/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expires_after: { seconds: 300 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI session error:", error);
      return NextResponse.json(
        { error: `Failed to create session: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
