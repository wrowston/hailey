"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { TranscriptEntry } from "@/hooks/useVoiceSession";

interface LiveTranscriptProps {
  transcript: TranscriptEntry[];
}

export default function LiveTranscript({ transcript }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-64"
    >
      <AnimatePresence mode="popLayout">
        {transcript.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex ${
              entry.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                entry.role === "user"
                  ? "bg-cyan-500/20 text-cyan-100 rounded-br-sm border border-cyan-500/20"
                  : "bg-white/5 text-gray-200 rounded-bl-sm border border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    entry.role === "user" ? "text-cyan-400" : "text-purple-400"
                  }`}
                >
                  {entry.role === "user" ? "You" : "Agent Alex"}
                </span>
              </div>
              <p>{entry.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {transcript.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-full"
        >
          <p className="text-gray-500 text-sm italic">
            Conversation will appear here...
          </p>
        </motion.div>
      )}
    </div>
  );
}
