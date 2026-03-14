"use client";

import { motion } from "framer-motion";
import UrgencyGauge from "./UrgencyGauge";
import { useState } from "react";

interface CallCardProps {
  call: {
    id: string;
    name: string | null;
    phone_number: string | null;
    email: string | null;
    address: string | null;
    issue: string;
    urgency: "emergency" | "urgent" | "routine";
    urgency_score: number;
    likely_job_type: string;
    notes: string | null;
    status: string;
    created_at: number;
  };
  index: number;
}

const urgencyBadgeStyles = {
  emergency:
    "bg-red-500/10 text-red-400 border border-red-500/20",
  urgent:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  routine:
    "bg-green-500/10 text-green-400 border border-green-500/20",
};

export default function CallCard({ call, index }: CallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        {/* Top row: urgency + status + date */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UrgencyGauge
              score={call.urgency_score}
              size="sm"
              showLabel={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyBadgeStyles[call.urgency]}`}
                >
                  {call.urgency.charAt(0).toUpperCase() +
                    call.urgency.slice(1)}
                </span>
                <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                  {call.likely_job_type}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {formatDate(call.created_at)}
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
        <p className="text-gray-200 text-sm mb-3 line-clamp-2">{call.issue}</p>

        {/* Contact info pills */}
        <div className="flex flex-wrap gap-2">
          {call.name && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/5">
              <svg
                className="w-3 h-3 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              {call.name}
            </span>
          )}
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
          {/* Address */}
          {call.address && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Address
              </h4>
              <p className="text-gray-300 text-sm">{call.address}</p>
            </div>
          )}

          {/* Notes (summary + urgency reason) */}
          {call.notes && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Notes
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {call.notes}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Status
            </h4>
            <span className="text-xs text-gray-400">
              {call.status.replace("_", " ")}
            </span>
          </div>

          {/* ID */}
          <p className="text-[10px] text-gray-600 font-mono">
            ID: {call.id.slice(0, 12)}...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
