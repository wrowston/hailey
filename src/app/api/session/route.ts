import { NextResponse } from "next/server";
import { REALTIME_SESSION_CONFIG } from "@/lib/agent-config";

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Create an ephemeral token for the Realtime API session
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: REALTIME_SESSION_CONFIG.model,
          voice: REALTIME_SESSION_CONFIG.voice,
          instructions: REALTIME_SESSION_CONFIG.instructions,
          tools: REALTIME_SESSION_CONFIG.tools,
          turn_detection: REALTIME_SESSION_CONFIG.turn_detection,
          input_audio_transcription: REALTIME_SESSION_CONFIG.input_audio_transcription,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI session error:", error);
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
