"use client";

import { motion } from "framer-motion";

interface UrgencyGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getUrgencyColor(score: number): string {
  if (score <= 3) return "#00ff88";
  if (score <= 5) return "#ffcc00";
  if (score <= 7) return "#ff8800";
  return "#ff4466";
}

function getUrgencyLabel(score: number): string {
  if (score <= 2) return "Low";
  if (score <= 4) return "Moderate";
  if (score <= 6) return "Elevated";
  if (score <= 8) return "High";
  return "Critical";
}

function getUrgencyBg(score: number): string {
  if (score <= 3) return "bg-green-500/10 border-green-500/30";
  if (score <= 5) return "bg-yellow-500/10 border-yellow-500/30";
  if (score <= 7) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

export default function UrgencyGauge({
  score,
  size = "md",
  showLabel = true,
}: UrgencyGaugeProps) {
  const color = getUrgencyColor(score);
  const label = getUrgencyLabel(score);
  const bgClass = getUrgencyBg(score);

  const sizes = {
    sm: { circle: 48, stroke: 4, text: "text-sm", labelText: "text-[9px]" },
    md: { circle: 72, stroke: 5, text: "text-xl", labelText: "text-xs" },
    lg: { circle: 96, stroke: 6, text: "text-3xl", labelText: "text-sm" },
  };

  const s = sizes[size];
  const radius = (s.circle - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.circle, height: s.circle }}>
        <svg
          width={s.circle}
          height={s.circle}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={s.circle / 2}
            cy={s.circle / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={s.stroke}
          />
          {/* Progress circle */}
          <motion.circle
            cx={s.circle / 2}
            cy={s.circle / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`${s.text} font-bold`}
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>

      {showLabel && (
        <motion.span
          className={`${s.labelText} font-semibold px-2 py-0.5 rounded-full border ${bgClass}`}
          style={{ color }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

export { getUrgencyColor, getUrgencyLabel, getUrgencyBg };
