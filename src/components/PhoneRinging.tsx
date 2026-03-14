"use client";

import { motion } from "framer-motion";

export default function PhoneRinging() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Ringing animation */}
      <div className="relative flex items-center justify-center">
        {/* Pulse rings */}
        <div className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/30 ring-pulse" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/20 ring-pulse-delayed" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/10 ring-pulse-delayed-2" />

        {/* Phone icon */}
        <motion.div
          className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan"
          animate={{
            rotate: [0, -15, 15, -15, 15, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 0.7,
          }}
        >
          <svg
            className="w-10 h-10 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold text-white mb-2">Calling...</h2>
        <p className="text-gray-400 text-sm">🔧 Mr Wrench Plumbing & HVAC</p>
        <motion.div
          className="flex items-center justify-center gap-1 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
