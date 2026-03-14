"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface ScheduledService {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  technicianName: string;
  category: string;
  priority: "emergency" | "urgent" | "routine";
  issueSummary: string;
  scheduledStart: number;
  scheduledEnd: number;
  status: string;
}

const PRIORITY_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  emergency: { dot: "bg-red-400", bg: "bg-red-400/10", text: "text-red-400" },
  urgent: { dot: "bg-orange-400", bg: "bg-orange-400/10", text: "text-orange-400" },
  routine: { dot: "bg-cyan-400", bg: "bg-cyan-400/10", text: "text-cyan-400" },
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, month, year, isCurrentMonth: true });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: d,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ServiceCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [services, setServices] = useState<ScheduledService[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    const rangeStart = new Date(viewYear, viewMonth, 1).getTime();
    const rangeEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59, 999).getTime();
    try {
      const res = await fetch(
        `/api/scheduled-services?rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`,
      );
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      console.error("Failed to fetch scheduled services");
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    setLoading(true);
    fetchServices();
  }, [fetchServices]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  };

  const cells = getMonthDays(viewYear, viewMonth);

  const servicesByDay = new Map<string, ScheduledService[]>();
  for (const svc of services) {
    const d = new Date(svc.scheduledStart);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = servicesByDay.get(key) || [];
    arr.push(svc);
    servicesByDay.set(key, arr);
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isToday = (cell: { date: number; month: number; year: number }) =>
    cell.date === today.getDate() &&
    cell.month === today.getMonth() &&
    cell.year === today.getFullYear();

  const selectedServices = selectedDay ? servicesByDay.get(selectedDay) || [] : [];

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Service Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-white min-w-[140px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-600 py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <motion.div
            className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const key = `${cell.year}-${cell.month}-${cell.date}`;
            const daySvcs = servicesByDay.get(key) || [];
            const hasServices = daySvcs.length > 0;
            const isSelected = selectedDay === key;
            const todayCell = isToday(cell);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`
                  relative p-1.5 min-h-[52px] flex flex-col items-center gap-1
                  border border-transparent rounded-lg transition-all duration-150
                  ${cell.isCurrentMonth ? "text-gray-300" : "text-gray-700"}
                  ${hasServices ? "hover:bg-white/5 cursor-pointer" : "cursor-default"}
                  ${isSelected ? "bg-white/5 border-white/10" : ""}
                `}
              >
                <span
                  className={`
                    text-xs font-medium leading-none
                    ${todayCell ? "w-5 h-5 flex items-center justify-center rounded-full bg-cyan-500 text-white" : ""}
                  `}
                >
                  {cell.date}
                </span>
                {hasServices && (
                  <div className="flex items-center gap-0.5">
                    {daySvcs.length <= 3 ? (
                      daySvcs.map((svc) => (
                        <span
                          key={svc._id}
                          className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[svc.priority]?.dot ?? "bg-gray-500"}`}
                        />
                      ))
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[daySvcs[0]!.priority]?.dot ?? "bg-gray-500"}`} />
                        <span className="text-[9px] text-gray-500 leading-none">
                          +{daySvcs.length - 1}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        {(["emergency", "urgent", "routine"] as const).map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[p].dot}`} />
            <span className="text-[10px] text-gray-500 capitalize">{p}</span>
          </div>
        ))}
      </div>

      {/* Expanded day details */}
      <AnimatePresence>
        {selectedDay && selectedServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {new Date(
                  selectedServices[0]!.scheduledStart,
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {selectedServices.map((svc) => {
                const colors = PRIORITY_COLORS[svc.priority] ?? PRIORITY_COLORS.routine;
                return (
                  <motion.div
                    key={svc._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl p-3 ${colors.bg} border border-white/5`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {formatTime(svc.scheduledStart)} – {formatTime(svc.scheduledEnd)}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {svc.priority}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">
                          {svc.customerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {svc.issueSummary}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-500">Technician</p>
                        <p className="text-xs text-gray-300 font-medium">
                          {svc.technicianName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-600">
                      <span className="capitalize">{svc.category}</span>
                      <span>·</span>
                      <span className="truncate">{svc.customerAddress}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
