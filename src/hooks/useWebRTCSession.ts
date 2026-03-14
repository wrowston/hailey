"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export interface CallData {
  phone_number?: string;
  email?: string;
  issue?: string;
  urgency_score?: number;
  urgency_reason?: string;
  summary?: string;
}

export type CallState = "idle" | "ringing" | "connecting" | "active" | "ending" | "ended";

export function useWebRTCSession() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [callId, setCallId] = useState<string>("");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Current transcript buffers
  const agentTranscriptBuffer = useRef<string>("");
  const currentResponseId = useRef<string>("");

  const startCall = useCallback(async () => {
    try {
      setError(null);
      const id = uuidv4();
      setCallId(id);
      setCallState("ringing");
      setTranscript([]);
      setCallData(null);

      // Create call record in DB
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", id }),
      });

      // Simulate ringing for 3 seconds (2 rings)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setCallState("connecting");

      // Get ephemeral token from backend
      const sessionRes = await fetch("/api/session", { method: "POST" });
      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        throw new Error(err.error || "Failed to create session");
      }
      const sessionData = await sessionRes.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error("No ephemeral key received from API");
      }

      // Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up remote audio playback
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];

        // Set up audio analysis for agent speaking detection
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      };

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.log("Data channel opened");
        setCallState("active");

        // Send initial response.create to trigger agent greeting
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["text", "audio"],
            },
          })
        );
      };

      dc.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleRealtimeEvent(msg, id);
      };

      // Create and set local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI Realtime API
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    } catch (err) {
      console.error("Call start error:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setCallState("idle");
    }
  }, []);

  const handleRealtimeEvent = useCallback(
    (msg: Record<string, unknown>, currentCallId: string) => {
      const eventType = msg.type as string;

      switch (eventType) {
        case "response.audio_transcript.delta": {
          const delta = msg.delta as string;
          agentTranscriptBuffer.current += delta;
          break;
        }

        case "response.audio_transcript.done": {
          const text = (msg.transcript as string) || agentTranscriptBuffer.current;
          if (text.trim()) {
            setTranscript((prev) => [
              ...prev,
              { role: "agent", text: text.trim(), timestamp: Date.now() },
            ]);
          }
          agentTranscriptBuffer.current = "";
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const text = msg.transcript as string;
          if (text?.trim()) {
            setTranscript((prev) => [
              ...prev,
              { role: "user", text: text.trim(), timestamp: Date.now() },
            ]);
          }
          break;
        }

        case "response.audio.delta": {
          setIsAgentSpeaking(true);
          break;
        }

        case "response.audio.done": {
          setIsAgentSpeaking(false);
          break;
        }

        case "input_audio_buffer.speech_started": {
          setIsUserSpeaking(true);
          break;
        }

        case "input_audio_buffer.speech_stopped": {
          setIsUserSpeaking(false);
          break;
        }

        case "response.function_call_arguments.done": {
          const name = msg.name as string;
          const args = JSON.parse(msg.arguments as string);
          const callItemId = msg.call_id as string;

          if (name === "save_call_data") {
            console.log("Agent called save_call_data:", args);
            setCallData(args as CallData);

            // Save to database
            fetch("/api/calls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "end",
                id: currentCallId,
                data: {
                  phone_number: args.phone_number,
                  email: args.email,
                  issue: args.issue,
                  urgency_score: args.urgency_score,
                  urgency_reason: args.urgency_reason,
                  summary: args.summary,
                },
              }),
            });

            // Send function call result back to the model
            if (dcRef.current?.readyState === "open") {
              dcRef.current.send(
                JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callItemId,
                    output: JSON.stringify({
                      success: true,
                      message: "Call data saved successfully. Please wrap up the call with the customer.",
                    }),
                  },
                })
              );

              // Trigger agent to respond after function call
              dcRef.current.send(
                JSON.stringify({
                  type: "response.create",
                  response: {
                    modalities: ["text", "audio"],
                  },
                })
              );
            }
          }
          break;
        }

        case "response.done": {
          const responseObj = msg.response as Record<string, unknown> | undefined;
          if (responseObj) {
            currentResponseId.current = responseObj.id as string || "";
          }
          setIsAgentSpeaking(false);
          break;
        }

        case "error": {
          console.error("Realtime error:", msg);
          setError((msg.error as Record<string, string>)?.message || "Realtime error occurred");
          break;
        }
      }
    },
    []
  );

  const endCall = useCallback(async () => {
    setCallState("ending");
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);

    // Save transcript to DB if we have call data
    if (callId) {
      const transcriptJson = JSON.stringify(transcript);
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          id: callId,
          data: {
            transcript: transcriptJson,
            ...(callData || {}),
          },
        }),
      });
    }

    // Close WebRTC connection
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setCallState("ended");
  }, [callId, transcript, callData]);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setCallData(null);
    setCallId("");
    setError(null);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
  }, []);

  return {
    callState,
    transcript,
    callData,
    callId,
    isAgentSpeaking,
    isUserSpeaking,
    error,
    analyserRef,
    startCall,
    endCall,
    resetCall,
  };
}
