"use client";

import { motion } from "framer-motion";
import UrgencyGauge from "./UrgencyGauge";
import { CallData, TranscriptEntry } from "@/hooks/useWebRTCSession";
import Link from "next/link";

interface CallSummaryProps {
  callData: CallData | null;
  transcript: TranscriptEntry[];
  onNewCall: () => void;
}

export default function CallSummary({
  callData,
  transcript,
  onNewCall,
}: CallSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Call Completed</h2>
        <p className="text-gray-400 text-sm mt-1">
          Here&apos;s the summary of the conversation
        </p>
      </motion.div>

      {callData ? (
        <>
          {/* Urgency Score */}
          <motion.div
            className="glass-card p-6 flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Urgency Assessment
            </h3>
            <UrgencyGauge score={callData.urgency_score || 1} size="lg" />
            {callData.urgency_reason && (
              <p className="text-gray-300 text-sm text-center">
                {callData.urgency_reason}
              </p>
            )}
          </motion.div>

          {/* Extracted Information */}
          <motion.div
            className="glass-card p-5 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Collected Information
            </h3>

            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-white font-medium">
                    {callData.phone_number || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-white font-medium">
                    {callData.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Issue */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-orange-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Issue
                  </p>
                  <p className="text-white font-medium">
                    {callData.issue || "Not captured"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary */}
          {callData.summary && (
            <motion.div
              className="glass-card p-5 space-y-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Call Summary
              </h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                {callData.summary}
              </p>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          className="glass-card p-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-400">
            Call ended before data could be fully collected.
          </p>
          {transcript.length > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              {transcript.length} messages exchanged
            </p>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={onNewCall}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all glow-cyan"
        >
          New Call
        </button>
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all text-center"
        >
          Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
}
