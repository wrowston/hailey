"use client";

import { motion } from "framer-motion";
import UrgencyGauge from "./UrgencyGauge";
import { useState } from "react";

interface CallCardProps {
  call: {
    id: string;
    phone_number: string | null;
    email: string | null;
    issue: string | null;
    urgency_score: number | null;
    urgency_reason: string | null;
    summary: string | null;
    transcript: string | null;
    status: string;
    started_at: string;
    ended_at: string | null;
  };
  index: number;
}

export default function CallCard({ call, index }: CallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    if (!call.started_at || !call.ended_at) return "—";
    const start = new Date(call.started_at).getTime();
    const end = new Date(call.ended_at).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  let parsedTranscript: { role: string; text: string }[] = [];
  if (call.transcript) {
    try {
      parsedTranscript = JSON.parse(call.transcript);
    } catch {
      // ignore
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="glass-card glass-card-hover overflow-hidden cursor-pointer transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Top row: urgency + date */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UrgencyGauge
              score={call.urgency_score || 0}
              size="sm"
              showLabel={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    call.status === "completed"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}
                >
                  {call.status === "completed" ? "Completed" : "In Progress"}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {formatDate(call.started_at)} • {getDuration()}
              </p>
            </div>
          </div>
          <motion.svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            animate={{ rotate: isExpanded ? 180 : 0 }}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </motion.svg>
        </div>

        {/* Issue summary */}
        {call.issue && (
          <p className="text-gray-200 text-sm mb-3 line-clamp-2">
            {call.issue}
          </p>
        )}

        {/* Contact info pills */}
        <div className="flex flex-wrap gap-2">
          {call.phone_number && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/5">
              <svg
                className="w-3 h-3 text-cyan-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {call.phone_number}
            </span>
          )}
          {call.email && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/5">
              <svg
                className="w-3 h-3 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {call.email}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {/* Summary */}
          {call.summary && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Summary
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {call.summary}
              </p>
            </div>
          )}

          {/* Urgency reason */}
          {call.urgency_reason && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Urgency Assessment
              </h4>
              <p className="text-gray-300 text-sm">{call.urgency_reason}</p>
            </div>
          )}

          {/* Transcript */}
          {parsedTranscript.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Transcript ({parsedTranscript.length} messages)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsedTranscript.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-xs px-3 py-2 rounded-lg ${
                      entry.role === "user"
                        ? "bg-cyan-500/10 text-cyan-200 ml-8"
                        : "bg-white/5 text-gray-300 mr-8"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        entry.role === "user"
                          ? "text-cyan-400"
                          : "text-purple-400"
                      }`}
                    >
                      {entry.role === "user" ? "Caller" : "Agent"}:
                    </span>{" "}
                    {entry.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call ID */}
          <p className="text-[10px] text-gray-600 font-mono">
            ID: {call.id.slice(0, 8)}...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
