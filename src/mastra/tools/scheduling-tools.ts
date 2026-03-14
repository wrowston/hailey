import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import convexClient from "../../lib/convex";
import { api } from "../../../convex/_generated/api";

const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 17;
const SLOT_DURATION_MS = 2 * 60 * 60 * 1000;
const SCHEDULING_DAYS_AHEAD = 5;

function getBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const now = new Date();
  const current = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  while (days.length < count) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

interface JobRecord {
  scheduledStart: number;
  scheduledEnd: number;
}

function findOpenSlots(
  day: Date,
  jobs: JobRecord[],
): { startTime: number; endTime: number }[] {
  const dayStart = new Date(day);
  dayStart.setHours(BUSINESS_HOURS_START, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(BUSINESS_HOURS_END, 0, 0, 0);

  const sorted = [...jobs]
    .filter(
      (j) =>
        j.scheduledEnd > dayStart.getTime() &&
        j.scheduledStart < dayEnd.getTime(),
    )
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const slots: { startTime: number; endTime: number }[] = [];
  let cursor = dayStart.getTime();

  for (const job of sorted) {
    const gapStart = cursor;
    const gapEnd = Math.min(job.scheduledStart, dayEnd.getTime());
    if (gapEnd - gapStart >= SLOT_DURATION_MS) {
      let slotStart = gapStart;
      while (slotStart + SLOT_DURATION_MS <= gapEnd) {
        slots.push({
          startTime: slotStart,
          endTime: slotStart + SLOT_DURATION_MS,
        });
        slotStart += SLOT_DURATION_MS;
      }
    }
    cursor = Math.max(cursor, job.scheduledEnd);
  }

  if (cursor < dayEnd.getTime()) {
    let slotStart = cursor;
    while (slotStart + SLOT_DURATION_MS <= dayEnd.getTime()) {
      slots.push({
        startTime: slotStart,
        endTime: slotStart + SLOT_DURATION_MS,
      });
      slotStart += SLOT_DURATION_MS;
    }
  }

  return slots;
}

export const availableSlotSchema = z.object({
  technicianId: z.string(),
  technicianName: z.string(),
  date: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  displayStart: z.string(),
  displayEnd: z.string(),
});

export type AvailableSlot = z.infer<typeof availableSlotSchema>;

export const checkAvailabilityTool = createTool({
  id: "check-availability",
  description:
    "Check technician availability for the next several business days. Returns a list of open 2-hour appointment windows.",
  inputSchema: z.object({
    likelyJobType: z
      .string()
      .describe("The type of job to match technician skills against"),
    urgency: z
      .enum(["emergency", "urgent", "routine"])
      .describe("Urgency level to prioritize scheduling"),
  }),
  outputSchema: z.object({
    availableSlots: z.array(availableSlotSchema),
  }),
  execute: async ({ likelyJobType, urgency }) => {
    const technicians = await convexClient.query(api.technicians.list, {});
    const businessDays = getBusinessDays(SCHEDULING_DAYS_AHEAD);
    const rangeStart = businessDays[0]!.getTime();
    const lastDay = new Date(businessDays[businessDays.length - 1]!);
    lastDay.setHours(BUSINESS_HOURS_END, 0, 0, 0);
    const rangeEnd = lastDay.getTime();

    const allSlots: AvailableSlot[] = [];

    const activeTechnicians = technicians.filter(
      (t) => t.status !== "offline",
    );

    const jobTypeKeywords = likelyJobType.toLowerCase().split(/[\s,/]+/);

    const scored = activeTechnicians.map((tech) => {
      const skillMatch = tech.skills.some((skill) =>
        jobTypeKeywords.some(
          (kw) => skill.toLowerCase().includes(kw) || kw.includes(skill.toLowerCase()),
        ),
      );
      let score = tech.reliabilityScore;
      if (skillMatch) score += 50;
      if (urgency === "emergency" || urgency === "urgent") {
        score += tech.reliabilityScore > 95 ? 20 : 0;
      }
      return { tech, score };
    });

    scored.sort((a, b) => b.score - a.score);

    for (const { tech } of scored) {
      const jobs = await convexClient.query(
        api.jobs.listByTechnicianInRange,
        {
          technicianId: tech._id,
          rangeStart,
          rangeEnd,
        },
      );

      for (const day of businessDays) {
        const dayJobs = jobs.filter((j) => {
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          return (
            j.scheduledEnd > dayStart.getTime() &&
            j.scheduledStart < dayEnd.getTime()
          );
        });

        const openSlots = findOpenSlots(day, dayJobs);
        for (const slot of openSlots) {
          allSlots.push({
            technicianId: tech._id,
            technicianName: tech.name,
            date: day.toISOString().split("T")[0]!,
            startTime: slot.startTime,
            endTime: slot.endTime,
            displayStart: new Date(slot.startTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            displayEnd: new Date(slot.endTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          });
        }
      }
    }

    const limitedSlots = allSlots.slice(0, 15);

    return { availableSlots: limitedSlots };
  },
});

export const bookAppointmentTool = createTool({
  id: "book-appointment",
  description:
    "Book an appointment by creating a job for the selected time slot and updating the service request to scheduled.",
  inputSchema: z.object({
    serviceRequestId: z.string().describe("The service request to schedule"),
    technicianId: z.string().describe("The technician to assign"),
    startTime: z.number().describe("Appointment start (unix ms)"),
    endTime: z.number().describe("Appointment end (unix ms)"),
    urgency: z
      .enum(["emergency", "urgent", "routine"])
      .describe("Priority level for the job"),
    jobType: z.string().describe("The job category"),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
  }),
  execute: async (input) => {
    const tech = await convexClient.query(api.technicians.getById, {
      id: input.technicianId as never,
    });

    const jobId = await convexClient.mutation(api.jobs.create, {
      requestId: input.serviceRequestId as never,
      technicianId: input.technicianId as never,
      priority: input.urgency,
      category: input.jobType,
      scheduledStart: input.startTime,
      scheduledEnd: input.endTime,
      status: "assigned",
    });

    await convexClient.mutation(api.serviceRequests.updateStatus, {
      id: input.serviceRequestId as never,
      status: "scheduled",
    });

    const serviceRequest = await convexClient.query(
      api.serviceRequests.getById,
      { id: input.serviceRequestId as never },
    );

    const customer = serviceRequest
      ? await convexClient.query(api.customers.getById, {
          id: serviceRequest.customerId,
        })
      : null;

    await convexClient.mutation(api.scheduledServices.create, {
      jobId: jobId as never,
      serviceRequestId: input.serviceRequestId as never,
      customerId: (serviceRequest?.customerId ?? ("" as never)) as never,
      customerName: customer?.name ?? "Unknown",
      customerPhone: customer?.phone ?? "",
      customerAddress: customer?.address ?? "",
      technicianId: input.technicianId as never,
      technicianName: tech?.name ?? "Unknown",
      category: input.jobType,
      priority: input.urgency,
      issueSummary: serviceRequest?.issueSummary ?? "",
      scheduledStart: input.startTime,
      scheduledEnd: input.endTime,
    });

    return {
      jobId,
      technicianName: tech?.name ?? "Unknown",
      scheduledStart: input.startTime,
      scheduledEnd: input.endTime,
    };
  },
});
