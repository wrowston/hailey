"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import WaveformVisualizer from "./WaveformVisualizer";
import LiveTranscript from "./LiveTranscript";
import { TranscriptEntry, CallData } from "@/hooks/useWebRTCSession";

interface ActiveCallProps {
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  transcript: TranscriptEntry[];
  callData: CallData | null;
  onEndCall: () => void;
}

export default function ActiveCall({
  isAgentSpeaking,
  isUserSpeaking,
  transcript,
  callData,
  onEndCall,
}: ActiveCallProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center w-full max-w-lg mx-auto gap-6"
    >
      {/* Agent Avatar & Status */}
      <div className="flex flex-col items-center gap-4">
        {/* Agent avatar with breathing/speaking animation */}
        <div className="relative">
          <motion.div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
              isAgentSpeaking
                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                : "bg-gradient-to-br from-purple-600/50 to-pink-600/50"
            }`}
            animate={
              isAgentSpeaking
                ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      "0 0 0px rgba(136, 68, 255, 0)",
                      "0 0 30px rgba(136, 68, 255, 0.5)",
                      "0 0 0px rgba(136, 68, 255, 0)",
                    ],
                  }
                : { scale: 1 }
            }
            transition={{
              duration: 0.6,
              repeat: isAgentSpeaking ? Infinity : 0,
            }}
          >
            🤖
          </motion.div>
          {/* Speaking indicator */}
          {isAgentSpeaking && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0a0a1a]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Agent Alex</h3>
          <p className="text-sm text-gray-400">🔧 Mr Wrench Plumbing & HVAC</p>
        </div>

        {/* Call timer */}
        <motion.div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-400 text-sm font-mono">
            {formatTime(elapsed)}
          </span>
        </motion.div>
      </div>

      {/* Waveforms */}
      <div className="w-full space-y-3">
        {/* Agent waveform */}
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
              Agent
            </span>
            {isAgentSpeaking && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-purple-300"
              >
                Speaking...
              </motion.span>
            )}
          </div>
          <WaveformVisualizer isActive={isAgentSpeaking} color="#8844ff" />
        </div>

        {/* User waveform */}
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              You
            </span>
            {isUserSpeaking && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-cyan-300"
              >
                Speaking...
              </motion.span>
            )}
          </div>
          <WaveformVisualizer isActive={isUserSpeaking} color="#00d4ff" />
        </div>
      </div>

      {/* Live Transcript */}
      <div className="w-full glass-card overflow-hidden">
        <div className="px-4 py-2 border-b border-white/5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Live Transcript
          </span>
        </div>
        <LiveTranscript transcript={transcript} />
      </div>

      {/* Collected data indicator */}
      {callData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full glass-card p-3 border-green-500/20"
        >
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Call data captured</span>
          </div>
        </motion.div>
      )}

      {/* End call button */}
      <motion.button
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors glow-red"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
