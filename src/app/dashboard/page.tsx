"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import CallCard from "@/components/CallCard";
import UrgencyGauge from "@/components/UrgencyGauge";
import Link from "next/link";
import { getUrgencyColor } from "@/components/UrgencyGauge";

interface Call {
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
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch("/api/calls");
      const data = await res.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, [fetchCalls]);

  const avgUrgency =
    calls.length > 0
      ? Math.round(
          (calls.reduce((sum, c) => sum + c.urgency_score, 0) / calls.length) *
            10
        ) / 10
      : 0;
  const highUrgencyCalls = calls.filter((c) => c.urgency_score >= 7).length;
  const emergencyCalls = calls.filter(
    (c) => c.urgency === "emergency"
  ).length;

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">
              Mr Wrench Dashboard
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Plumbing & HVAC • Call Analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-sm text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            New Call
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Calls */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Total Calls
            </p>
            <motion.p
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {calls.length}
            </motion.p>
          </motion.div>

          {/* Emergency */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Emergency
            </p>
            <motion.p
              className="text-3xl font-bold text-red-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {emergencyCalls}
            </motion.p>
          </motion.div>

          {/* Avg Urgency */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Avg Urgency
            </p>
            <motion.p
              className="text-3xl font-bold"
              style={{ color: getUrgencyColor(avgUrgency) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {avgUrgency || "—"}
            </motion.p>
          </motion.div>

          {/* High Urgency */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              High Urgency
            </p>
            <motion.p
              className="text-3xl font-bold text-red-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {highUrgencyCalls}
            </motion.p>
          </motion.div>
        </div>

        {/* Urgency Distribution (if enough calls) */}
        {calls.length > 0 && (
          <motion.div
            className="glass-card p-5 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Urgency Distribution
            </h3>
            <div className="flex items-end justify-center gap-4 h-24">
              {calls.map((call, i) => (
                <motion.div
                  key={call.id}
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  style={{ transformOrigin: "bottom" }}
                >
                  <span className="text-[9px] text-gray-500">
                    {call.urgency_score}
                  </span>
                  <div
                    className="w-8 rounded-t-md"
                    style={{
                      height: `${(call.urgency_score / 10) * 80}px`,
                      backgroundColor: getUrgencyColor(call.urgency_score),
                      opacity: 0.7,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Service Requests</h2>
            <button
              onClick={fetchCalls}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : calls.length === 0 ? (
            <motion.div
              className="glass-card p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No calls yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start a call to see it appear here
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Generate Call
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {calls.map((call, index) => (
                <CallCard key={call.id} call={call} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-600 text-xs border-t border-white/5 mt-8">
        Built with Next.js • Mastra • xAI Voice Agent API
      </footer>
    </div>
  );
}
