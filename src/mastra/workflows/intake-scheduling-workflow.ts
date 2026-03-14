import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { lookupCustomerTool, saveIntakeTool } from "../tools/intake-tools";
import {
  checkAvailabilityTool,
  bookAppointmentTool,
  findBumpableJobsTool,
  bumpAndRescheduleJobTool,
  sendConfirmationEmailTool,
  availableSlotSchema,
} from "../tools/scheduling-tools";

const saveIntakeStep = createStep({
  id: "save-intake",
  description:
    "Look up or create the customer and create a service request in Convex",
  inputSchema: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string(),
    issueSummary: z.string(),
    notes: z.string().optional(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    urgencyScore: z.number(),
    likelyJobType: z.string(),
  }),
  outputSchema: z.object({
    customerId: z.string(),
    serviceRequestId: z.string(),
    isReturningCustomer: z.boolean(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
  }),
  execute: async ({ inputData }) => {
    let existingCustomerId: string | undefined;

    if (inputData.phone) {
      const lookup = await lookupCustomerTool.execute!({
        phone: inputData.phone,
      });
      if (lookup?.found && lookup.customer) {
        existingCustomerId = lookup.customer.id;
      }
    }

    const result = await saveIntakeTool.execute!({
      existingCustomerId,
      name: inputData.name,
      phone: inputData.phone,
      email: inputData.email,
      address: inputData.address,
      issueSummary: inputData.issueSummary,
      notes: inputData.notes,
      urgency: inputData.urgency,
      urgencyScore: inputData.urgencyScore,
      likelyJobType: inputData.likelyJobType,
    });

    const output = {
      customerId: result.customerId,
      serviceRequestId: result.serviceRequestId,
      isReturningCustomer: result.isReturningCustomer,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
    };

    console.log("[workflow:save-intake] Step complete", {
      customerId: output.customerId,
      serviceRequestId: output.serviceRequestId,
      isReturningCustomer: output.isReturningCustomer,
    });

    return output;
  },
});

const findAvailabilityStep = createStep({
  id: "find-availability",
  description:
    "Query technician schedules and find open appointment windows. For emergencies, includes same-day slots and can bump routine checkups if needed.",
  inputSchema: z.object({
    customerId: z.string(),
    serviceRequestId: z.string(),
    isReturningCustomer: z.boolean(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
  }),
  outputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    availableSlots: z.array(availableSlotSchema),
    isEmergencyAutoScheduled: z.boolean(),
    bumpedJobId: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const result = await checkAvailabilityTool.execute!({
      likelyJobType: inputData.likelyJobType,
      urgency: inputData.urgency,
    });

    let slots = result.availableSlots;
    let isEmergencyAutoScheduled = false;
    let bumpedJobId: string | undefined;

    if (inputData.urgency === "emergency") {
      const today = new Date().toISOString().split("T")[0];
      const hasSameDaySlot = slots.some(
        (s: { date: string }) => s.date === today,
      );

      if (!hasSameDaySlot && slots.length === 0) {
        console.log(
          "[workflow:find-availability] Emergency with no open slots — searching for bumpable routine checkups",
        );

        const bumpResult = await findBumpableJobsTool.execute!({
          likelyJobType: inputData.likelyJobType,
        });

        if (bumpResult.bumpableJobs.length > 0) {
          const target = bumpResult.bumpableJobs[0]!;

          const bumpExec = await bumpAndRescheduleJobTool.execute!({
            bumpJobId: target.jobId,
            emergencyServiceRequestId: inputData.serviceRequestId,
          });

          if (bumpExec.success && bumpExec.freedSlot) {
            slots = [bumpExec.freedSlot];
            isEmergencyAutoScheduled = true;
            bumpedJobId = bumpExec.bumpedJobId;

            console.log(
              "[workflow:find-availability] Emergency escalation — bumped routine checkup",
              {
                bumpedJobId: target.jobId,
                freedSlot: bumpExec.freedSlot,
              },
            );
          }
        } else {
          console.warn(
            "[workflow:find-availability] Emergency but no bumpable routine checkups found — falling back to earliest available slot",
          );
        }
      } else if (hasSameDaySlot) {
        isEmergencyAutoScheduled = true;
      }
    }

    const output = {
      serviceRequestId: inputData.serviceRequestId,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
      availableSlots: slots,
      isEmergencyAutoScheduled,
      bumpedJobId,
    };

    console.log("[workflow:find-availability] Step complete", {
      serviceRequestId: output.serviceRequestId,
      slotsFound: output.availableSlots.length,
      isEmergencyAutoScheduled,
      bumpedJobId,
    });

    return output;
  },
});

const awaitConfirmationStep = createStep({
  id: "await-confirmation",
  description:
    "For emergencies with a same-day slot, auto-select the earliest slot. Otherwise, suspend and wait for the customer to pick a time slot.",
  inputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    availableSlots: z.array(availableSlotSchema),
    isEmergencyAutoScheduled: z.boolean(),
    bumpedJobId: z.string().optional(),
  }),
  outputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    selectedSlot: availableSlotSchema,
    wasAutoScheduled: z.boolean(),
    bumpedJobId: z.string().optional(),
  }),
  resumeSchema: z.object({
    selectedSlot: availableSlotSchema,
  }),
  suspendSchema: z.object({
    availableSlots: z.array(availableSlotSchema),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (
      inputData.isEmergencyAutoScheduled &&
      inputData.availableSlots.length > 0
    ) {
      const earliest = inputData.availableSlots[0]!;
      console.log(
        "[workflow:await-confirmation] Emergency auto-scheduled — selecting earliest slot",
        {
          serviceRequestId: inputData.serviceRequestId,
          selectedSlot: earliest,
        },
      );
      return {
        serviceRequestId: inputData.serviceRequestId,
        urgency: inputData.urgency,
        likelyJobType: inputData.likelyJobType,
        selectedSlot: earliest,
        wasAutoScheduled: true,
        bumpedJobId: inputData.bumpedJobId,
      };
    }

    if (!resumeData?.selectedSlot) {
      console.log(
        "[workflow:await-confirmation] Suspending — waiting for customer slot selection",
        {
          serviceRequestId: inputData.serviceRequestId,
          slotsOffered: inputData.availableSlots.length,
        },
      );
      return await suspend({
        availableSlots: inputData.availableSlots,
      });
    }

    console.log("[workflow:await-confirmation] Step complete — slot selected", {
      serviceRequestId: inputData.serviceRequestId,
      selectedSlot: resumeData.selectedSlot,
    });

    return {
      serviceRequestId: inputData.serviceRequestId,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
      selectedSlot: resumeData.selectedSlot,
      wasAutoScheduled: false,
      bumpedJobId: undefined,
    };
  },
});

const bookAppointmentStep = createStep({
  id: "book-appointment",
  description:
    "Create the job record and assign the technician for the confirmed slot. Links bumped jobs when an emergency displaced a routine checkup.",
  inputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    selectedSlot: availableSlotSchema,
    wasAutoScheduled: z.boolean(),
    bumpedJobId: z.string().optional(),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
    displayStart: z.string(),
    displayEnd: z.string(),
    date: z.string(),
    wasAutoScheduled: z.boolean(),
    customerId: z.string(),
    customerName: z.string(),
    customerEmail: z.string().optional(),
    issueSummary: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { selectedSlot } = inputData;

    const result = await bookAppointmentTool.execute!({
      serviceRequestId: inputData.serviceRequestId,
      technicianId: selectedSlot.technicianId,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      urgency: inputData.urgency,
      jobType: inputData.likelyJobType,
    });

    if (inputData.bumpedJobId) {
      const convexClient = (await import("../../lib/convex")).default;
      const { api } = await import("../../../convex/_generated/api");
      await convexClient.mutation(api.jobs.setBumpedBy, {
        id: inputData.bumpedJobId as never,
        bumpedByJobId: result.jobId as never,
      });

      console.log(
        "[workflow:book-appointment] Linked bumped job to emergency",
        { bumpedJobId: inputData.bumpedJobId, emergencyJobId: result.jobId },
      );
    }

    const output = {
      jobId: result.jobId,
      technicianName: result.technicianName,
      scheduledStart: result.scheduledStart,
      scheduledEnd: result.scheduledEnd,
      displayStart: selectedSlot.displayStart,
      displayEnd: selectedSlot.displayEnd,
      date: selectedSlot.date,
      wasAutoScheduled: inputData.wasAutoScheduled,
      customerId: result.customerId,
      customerName: result.customerName,
      customerEmail: result.customerEmail,
      issueSummary: result.issueSummary,
    };

    console.log("[workflow:book-appointment] Step complete", {
      jobId: output.jobId,
      technicianName: output.technicianName,
      date: output.date,
      displayStart: output.displayStart,
      displayEnd: output.displayEnd,
      wasAutoScheduled: output.wasAutoScheduled,
    });

    return output;
  },
});

const sendConfirmationStep = createStep({
  id: "send-confirmation",
  description:
    "Send a confirmation email to the customer with their appointment details",
  inputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
    displayStart: z.string(),
    displayEnd: z.string(),
    date: z.string(),
    customerId: z.string(),
    customerName: z.string(),
    customerEmail: z.string().optional(),
    issueSummary: z.string(),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
    displayStart: z.string(),
    displayEnd: z.string(),
    date: z.string(),
    emailSent: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    let emailSent = false;

    if (inputData.customerEmail) {
      const result = await sendConfirmationEmailTool.execute!({
        customerId: inputData.customerId,
        customerName: inputData.customerName,
        customerEmail: inputData.customerEmail,
        jobId: inputData.jobId,
        technicianName: inputData.technicianName,
        date: inputData.date,
        displayStart: inputData.displayStart,
        displayEnd: inputData.displayEnd,
        issueSummary: inputData.issueSummary,
      });

      emailSent = result.emailSent;

      console.log("[workflow:send-confirmation] Email result", {
        emailSent: result.emailSent,
        messageId: result.messageId,
      });
    } else {
      console.log("[workflow:send-confirmation] No email on file — skipping");
    }

    return {
      jobId: inputData.jobId,
      technicianName: inputData.technicianName,
      scheduledStart: inputData.scheduledStart,
      scheduledEnd: inputData.scheduledEnd,
      displayStart: inputData.displayStart,
      displayEnd: inputData.displayEnd,
      date: inputData.date,
      emailSent,
    };
  },
});

export const intakeSchedulingWorkflow = createWorkflow({
  id: "intake-scheduling-workflow",
  inputSchema: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string(),
    issueSummary: z.string(),
    notes: z.string().optional(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    urgencyScore: z.number(),
    likelyJobType: z.string(),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
    displayStart: z.string(),
    displayEnd: z.string(),
    date: z.string(),
    wasAutoScheduled: z.boolean(),
    emailSent: z.boolean(),
  }),
})
  .then(saveIntakeStep)
  .then(findAvailabilityStep)
  .then(awaitConfirmationStep)
  .then(bookAppointmentStep)
  .then(sendConfirmationStep)
  .commit();
