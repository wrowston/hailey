"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
}

export default function WaveformVisualizer({
  isActive,
  color = "#00d4ff",
  barCount = 32,
}: WaveformVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(barCount).fill(4));
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(barCount).fill(4));
      return;
    }

    const animate = () => {
      setBars(
        Array.from({ length: barCount }, () =>
          isActive ? Math.random() * 40 + 4 : 4
        )
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };

    // Throttle to ~20fps for performance
    const interval = setInterval(() => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    }, 50);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, barCount]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            backgroundColor: color,
            opacity: isActive ? 0.8 : 0.2,
          }}
          animate={{ height }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
