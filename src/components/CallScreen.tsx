"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import PhoneRinging from "./PhoneRinging";
import ActiveCall from "./ActiveCall";
import CallSummary from "./CallSummary";
import Link from "next/link";

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CallScreen() {
  const [callerPhone, setCallerPhone] = useState("");

  const {
    callState,
    transcript,
    callData,
    isAgentSpeaking,
    isUserSpeaking,
    error,
    startCall,
    endCall,
    resetCall,
  } = useVoiceSession();

  const handleStartCall = () => {
    const digits = callerPhone.replace(/\D/g, "");
    startCall(digits || undefined);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCallerPhone(formatPhoneDisplay(raw));
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Mr Wrench</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Plumbing & HVAC • AI Phone Agent
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Dashboard
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {/* IDLE STATE - Generate Call button */}
          {callState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Floating phone icon */}
              <motion.div
                className="relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-cyan-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </div>
                </div>
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-xl" />
              </motion.div>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  🔧 Mr Wrench
                </h2>
                <p className="text-gray-400 max-w-sm">
                  Enter a caller&apos;s phone number to simulate an incoming call. If the number matches an existing customer, the agent will recognize them.
                </p>
              </div>

              {/* Phone input */}
              <div className="w-full max-w-xs space-y-2">
                <label
                  htmlFor="caller-phone"
                  className="block text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Caller Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    id="caller-phone"
                    type="tel"
                    value={callerPhone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Leave blank to simulate a call from an unknown number
                </p>
              </div>

              {/* Generate Call button */}
              <motion.button
                onClick={handleStartCall}
                className="relative group px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
                <span className="relative flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Generate Call
                </span>
              </motion.button>

              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-sm p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                >
                  <p className="font-semibold mb-1">Error</p>
                  <p>{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RINGING STATE */}
          {callState === "ringing" && (
            <motion.div
              key="ringing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <PhoneRinging />
            </motion.div>
          )}

          {/* CONNECTING STATE */}
          {callState === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-cyan-400 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-400">Connecting...</p>
            </motion.div>
          )}

          {/* ACTIVE CALL STATE */}
          {callState === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <ActiveCall
                isAgentSpeaking={isAgentSpeaking}
                isUserSpeaking={isUserSpeaking}
                transcript={transcript}
                callData={callData}
                onEndCall={endCall}
              />
            </motion.div>
          )}

          {/* ENDING STATE */}
          {callState === "ending" && (
            <motion.div
              key="ending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-red-400 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-400">Ending call...</p>
            </motion.div>
          )}

          {/* ENDED STATE - Summary */}
          {callState === "ended" && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <CallSummary
                callData={callData}
                transcript={transcript}
                onNewCall={resetCall}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-600 text-xs">
        Built with Next.js • Mastra • xAI Voice Agent API
      </footer>
    </div>
  );
}
