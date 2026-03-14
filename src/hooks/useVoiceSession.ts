"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { XAI_SESSION_CONFIG, buildSystemPrompt, CustomerContext } from "@/lib/agent-config";

export interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export interface CallData {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  issue?: string;
  urgency?: "emergency" | "urgent" | "routine";
  urgency_score?: number;
  urgency_reason?: string;
  likely_job_type?: string;
  summary?: string;
  booking?: {
    jobId: string;
    technicianName: string;
    date: string;
    displayStart: string;
    displayEnd: string;
  };
}

export type CallState = "idle" | "ringing" | "connecting" | "active" | "ending" | "ended";

const SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

export function useVoiceSession() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [callId, setCallId] = useState<string>("");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const agentTranscriptBuffer = useRef<string>("");
  const isSessionReadyRef = useRef(false);
  const micBufferRef = useRef<Int16Array[]>([]);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const playbackOffsetRef = useRef(0);
  const workflowRunIdRef = useRef<string | null>(null);
  const availableSlotsRef = useRef<Record<string, unknown>[]>([]);

  const sendWsMessage = useCallback((event: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  const handleRealtimeEvent = useCallback(
    (msg: Record<string, unknown>, currentCallId: string) => {
      const eventType = msg.type as string;

      switch (eventType) {
        case "session.updated": {
          isSessionReadyRef.current = true;

          // Flush buffered mic audio
          const buffered = micBufferRef.current;
          for (const chunk of buffered) {
            sendWsMessage({
              type: "input_audio_buffer.append",
              audio: int16ToBase64(chunk),
            });
          }
          micBufferRef.current = [];

          setCallState("active");

          sendWsMessage({
            type: "response.create",
            response: { modalities: ["text", "audio"] },
          });
          break;
        }

        case "response.output_audio_transcript.delta": {
          const delta = msg.delta as string;
          agentTranscriptBuffer.current += delta;
          break;
        }

        case "response.output_audio_transcript.done": {
          const text =
            (msg.transcript as string) || agentTranscriptBuffer.current;
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

        case "response.output_audio.delta": {
          setIsAgentSpeaking(true);
          const audioData = msg.delta as string;
          if (audioData) {
            const int16 = base64ToInt16(audioData);
            const float32 = int16ToFloat32(int16);
            playbackQueueRef.current.push(float32);
          }
          break;
        }

        case "response.output_audio.done": {
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
          const fnName = msg.name as string;
          const args = JSON.parse(msg.arguments as string);
          const callItemId = msg.call_id as string;

          if (fnName === "check_availability") {
            console.log("Agent called check_availability:", args);
            setCallData(args as CallData);

            fetch("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "check",
                data: args,
              }),
            })
              .then((res) => res.json())
              .then((result) => {
                if (result.runId) {
                  workflowRunIdRef.current = result.runId;
                }
                if (result.availableSlots) {
                  availableSlotsRef.current = result.availableSlots;
                }

                sendWsMessage({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callItemId,
                    output: JSON.stringify({
                      success: true,
                      run_id: result.runId,
                      available_slots: result.availableSlots ?? [],
                      message:
                        "Here are the available appointment slots. Present these options to the customer and ask which time works best for them.",
                    }),
                  },
                });

                sendWsMessage({
                  type: "response.create",
                  response: { modalities: ["text", "audio"] },
                });
              })
              .catch((err) => {
                console.error("check_availability error:", err);
                sendWsMessage({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callItemId,
                    output: JSON.stringify({
                      success: false,
                      message:
                        "Sorry, I was unable to check availability right now. Let the customer know we will call them back to schedule.",
                    }),
                  },
                });
                sendWsMessage({
                  type: "response.create",
                  response: { modalities: ["text", "audio"] },
                });
              });
          }

          if (fnName === "confirm_booking") {
            console.log("Agent called confirm_booking:", args);

            const runId = args.run_id || workflowRunIdRef.current;
            const selectedSlot = args.selected_slot;

            fetch("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "confirm",
                runId,
                selectedSlot,
              }),
            })
              .then((res) => res.json())
              .then((result) => {
                if (result.status === "success" && result.result) {
                  setCallData((prev) => ({
                    ...prev,
                    booking: {
                      jobId: result.result.jobId,
                      technicianName: result.result.technicianName,
                      date: result.result.date,
                      displayStart: result.result.displayStart,
                      displayEnd: result.result.displayEnd,
                    },
                  }));
                }

                sendWsMessage({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callItemId,
                    output: JSON.stringify({
                      success: true,
                      booking: result.result ?? null,
                      message:
                        "Appointment booked successfully! Confirm the details with the customer and wrap up the call warmly.",
                    }),
                  },
                });

                sendWsMessage({
                  type: "response.create",
                  response: { modalities: ["text", "audio"] },
                });
              })
              .catch((err) => {
                console.error("confirm_booking error:", err);
                sendWsMessage({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callItemId,
                    output: JSON.stringify({
                      success: false,
                      message:
                        "Sorry, I was unable to confirm the booking right now. Let the customer know we will call them back to confirm.",
                    }),
                  },
                });
                sendWsMessage({
                  type: "response.create",
                  response: { modalities: ["text", "audio"] },
                });
              });
          }
          break;
        }

        case "response.done": {
          setIsAgentSpeaking(false);
          break;
        }

        case "error": {
          console.error("Realtime error:", msg);
          setError(
            (msg.error as Record<string, string>)?.message ||
              (msg.message as string) ||
              "Realtime error occurred"
          );
          break;
        }
      }
    },
    [sendWsMessage]
  );

  const startCall = useCallback(async (callerPhone?: string) => {
    try {
      setError(null);
      const id = uuidv4();
      setCallId(id);
      setCallState("ringing");
      setTranscript([]);
      setCallData(null);
      isSessionReadyRef.current = false;
      micBufferRef.current = [];
      playbackQueueRef.current = [];
      playbackOffsetRef.current = 0;
      workflowRunIdRef.current = null;
      availableSlotsRef.current = [];

      // Look up customer by phone if provided, in parallel with mic/token
      let customerContext: CustomerContext | null = null;
      const customerLookup = callerPhone
        ? fetch("/api/customer-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: callerPhone }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.found) {
                customerContext = data.customer;
              }
            })
            .catch((err) => console.error("Customer lookup failed:", err))
        : Promise.resolve();

      // Start mic capture, token fetch, and customer lookup in parallel
      const [stream, sessionRes] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<void>((resolve) => setTimeout(resolve, 3000)).then(() => {
          setCallState("connecting");
          return fetch("/api/session", { method: "POST" });
        }),
        customerLookup,
      ]);

      streamRef.current = stream;

      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        throw new Error(err.error || "Failed to create session");
      }

      const sessionData = await sessionRes.json();
      const ephemeralToken = sessionData.value;

      if (!ephemeralToken) {
        throw new Error("No ephemeral token received from API");
      }

      // Create AudioContext at 24kHz to match xAI's expected sample rate
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;

      // Set up mic input: stream -> ScriptProcessorNode -> base64 -> WebSocket
      const source = audioContext.createMediaStreamSource(stream);
      const inputProcessor = audioContext.createScriptProcessor(
        BUFFER_SIZE,
        1,
        1
      );
      inputProcessorRef.current = inputProcessor;

      inputProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(new Float32Array(inputData));

        if (isSessionReadyRef.current) {
          sendWsMessage({
            type: "input_audio_buffer.append",
            audio: int16ToBase64(int16),
          });
        } else {
          micBufferRef.current.push(int16);
        }
      };

      source.connect(inputProcessor);
      inputProcessor.connect(audioContext.destination);

      // Set up audio output: playback queue -> ScriptProcessorNode -> speakers
      const outputProcessor = audioContext.createScriptProcessor(
        BUFFER_SIZE,
        1,
        1
      );
      outputProcessorRef.current = outputProcessor;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      outputProcessor.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        let outputIdx = 0;

        while (outputIdx < output.length) {
          if (playbackQueueRef.current.length === 0) {
            output.fill(0, outputIdx);
            break;
          }

          const currentChunk = playbackQueueRef.current[0];
          const offset = playbackOffsetRef.current;
          const remaining = currentChunk.length - offset;
          const needed = output.length - outputIdx;

          if (remaining <= needed) {
            output.set(currentChunk.subarray(offset), outputIdx);
            outputIdx += remaining;
            playbackQueueRef.current.shift();
            playbackOffsetRef.current = 0;
          } else {
            output.set(
              currentChunk.subarray(offset, offset + needed),
              outputIdx
            );
            playbackOffsetRef.current += needed;
            outputIdx += needed;
          }
        }
      };

      outputProcessor.connect(analyser);
      analyser.connect(audioContext.destination);

      // Connect WebSocket to xAI Voice Agent API
      const ws = new WebSocket("wss://api.x.ai/v1/realtime", [
        `xai-client-secret.${ephemeralToken}`,
      ]);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected to xAI Voice Agent API");
        const sessionConfig = {
          ...XAI_SESSION_CONFIG,
          instructions: buildSystemPrompt(customerContext),
        };
        if (customerContext) {
          console.log(`Returning customer detected: ${customerContext.name}`);
        }
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: sessionConfig,
          })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleRealtimeEvent(msg, id);
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        if (event.code !== 1000 && event.code !== 1005) {
          setError(`Connection closed unexpectedly (${event.code})`);
        }
      };
    } catch (err) {
      console.error("Call start error:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setCallState("idle");
    }
  }, [handleRealtimeEvent, sendWsMessage]);

  const endCall = useCallback(async () => {
    setCallState("ending");
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);

    if (inputProcessorRef.current) {
      inputProcessorRef.current.disconnect();
      inputProcessorRef.current = null;
    }
    if (outputProcessorRef.current) {
      outputProcessorRef.current.disconnect();
      outputProcessorRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    isSessionReadyRef.current = false;
    micBufferRef.current = [];
    playbackQueueRef.current = [];
    playbackOffsetRef.current = 0;
    workflowRunIdRef.current = null;
    availableSlotsRef.current = [];

    setCallState("ended");
  }, []);

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
