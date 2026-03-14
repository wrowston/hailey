import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Resend } from "resend";
import convexClient from "../../lib/convex";
import { api } from "../../../convex/_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    customerId: z.string(),
    customerName: z.string(),
    customerEmail: z.string().optional(),
    issueSummary: z.string(),
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
      customerId: customer?._id ?? "",
      customerName: customer?.name ?? "Unknown",
      customerEmail: customer?.email ?? undefined,
      issueSummary: serviceRequest?.issueSummary ?? "",
    };
  },
});

export const sendConfirmationEmailTool = createTool({
  id: "send-confirmation-email",
  description:
    "Send a booking confirmation email to the customer and log it to outgoing messages.",
  inputSchema: z.object({
    customerId: z.string().describe("Convex customer ID"),
    customerName: z.string(),
    customerEmail: z.string().describe("Customer email address"),
    jobId: z.string().describe("Convex job ID"),
    technicianName: z.string(),
    date: z.string().describe("Appointment date (YYYY-MM-DD)"),
    displayStart: z.string().describe("Human-readable start time"),
    displayEnd: z.string().describe("Human-readable end time"),
    issueSummary: z.string(),
  }),
  outputSchema: z.object({
    emailSent: z.boolean(),
    messageId: z.string().optional(),
    outgoingMessageId: z.string().optional(),
  }),
  execute: async (input) => {
    const formattedDate = new Date(input.date + "T00:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long", month: "long", day: "numeric", year: "numeric" },
    );

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1e40af; padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔧 Mr Wrench Plumbing &amp; HVAC</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Appointment Confirmation</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${input.customerName},</p>
          <p>Your appointment has been confirmed! Here are the details:</p>
          <div style="background: #f0f9ff; border-left: 4px solid #1e40af; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
              <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Date</td><td style="padding: 6px 0; font-weight: 600;">${formattedDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Time</td><td style="padding: 6px 0; font-weight: 600;">${input.displayStart} – ${input.displayEnd}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Technician</td><td style="padding: 6px 0; font-weight: 600;">${input.technicianName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Service</td><td style="padding: 6px 0;">${input.issueSummary}</td></tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Your technician will arrive within the scheduled time window. Please make sure someone is available to provide access to the service area.</p>
          <p style="font-size: 14px; color: #6b7280;">Need to reschedule? Call us at <strong>(801) 555-0199</strong>.</p>
        </div>
        <div style="background: #f9fafb; padding: 20px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">Mr Wrench Plumbing &amp; HVAC · 1650 Digital Dr, Lehi, UT 84043</p>
        </div>
      </div>
    `;

    const textBody = `Hi ${input.customerName},

Your appointment has been confirmed!

Date: ${formattedDate}
Time: ${input.displayStart} – ${input.displayEnd}
Technician: ${input.technicianName}
Service: ${input.issueSummary}

Your technician will arrive within the scheduled time window. Please make sure someone is available to provide access to the service area.

Need to reschedule? Call us at (801) 555-0199.

Mr Wrench Plumbing & HVAC
1650 Digital Dr, Lehi, UT 84043`;

    let emailSent = false;
    let messageId: string | undefined;

    try {
      const { data, error } = await resend.emails.send({
        from: "Mr Wrench <onboarding@resend.dev>",
        to: [input.customerEmail],
        subject: `Appointment Confirmed – ${formattedDate} at ${input.displayStart}`,
        html: htmlBody,
        text: textBody,
      });

      if (error) {
        console.error("[send-confirmation-email] Resend error:", error);
      } else {
        emailSent = true;
        messageId = data?.id;
        console.log("[send-confirmation-email] Email sent:", messageId);
      }
    } catch (err) {
      console.error("[send-confirmation-email] Failed to send:", err);
    }

    let outgoingMessageId: string | undefined;
    try {
      outgoingMessageId = await convexClient.mutation(
        api.outgoingMessages.create,
        {
          customerId: input.customerId as never,
          relatedJobId: input.jobId as never,
          messageType: "dispatch_confirmation",
          content: `Confirmation email ${emailSent ? "sent" : "failed"} to ${input.customerEmail}. Appointment: ${formattedDate} ${input.displayStart}–${input.displayEnd} with ${input.technicianName}.`,
        },
      );
    } catch (err) {
      console.error("[send-confirmation-email] Failed to log message:", err);
    }

    return { emailSent, messageId, outgoingMessageId };
  },
});
