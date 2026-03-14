import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { lookupCustomerTool, saveIntakeTool } from "../tools/intake-tools";
import {
  checkAvailabilityTool,
  bookAppointmentTool,
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

    return {
      customerId: result.customerId,
      serviceRequestId: result.serviceRequestId,
      isReturningCustomer: result.isReturningCustomer,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
    };
  },
});

const findAvailabilityStep = createStep({
  id: "find-availability",
  description:
    "Query technician schedules and find open appointment windows",
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
  }),
  execute: async ({ inputData }) => {
    const result = await checkAvailabilityTool.execute!({
      likelyJobType: inputData.likelyJobType,
      urgency: inputData.urgency,
    });

    return {
      serviceRequestId: inputData.serviceRequestId,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
      availableSlots: result.availableSlots,
    };
  },
});

const awaitConfirmationStep = createStep({
  id: "await-confirmation",
  description:
    "Suspend the workflow and wait for the customer to pick a time slot",
  inputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    availableSlots: z.array(availableSlotSchema),
  }),
  outputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    selectedSlot: availableSlotSchema,
  }),
  resumeSchema: z.object({
    selectedSlot: availableSlotSchema,
  }),
  suspendSchema: z.object({
    availableSlots: z.array(availableSlotSchema),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData?.selectedSlot) {
      return await suspend({
        availableSlots: inputData.availableSlots,
      });
    }

    return {
      serviceRequestId: inputData.serviceRequestId,
      urgency: inputData.urgency,
      likelyJobType: inputData.likelyJobType,
      selectedSlot: resumeData.selectedSlot,
    };
  },
});

const bookAppointmentStep = createStep({
  id: "book-appointment",
  description:
    "Create the job record and assign the technician for the confirmed slot",
  inputSchema: z.object({
    serviceRequestId: z.string(),
    urgency: z.enum(["emergency", "urgent", "routine"]),
    likelyJobType: z.string(),
    selectedSlot: availableSlotSchema,
  }),
  outputSchema: z.object({
    jobId: z.string(),
    technicianName: z.string(),
    scheduledStart: z.number(),
    scheduledEnd: z.number(),
    displayStart: z.string(),
    displayEnd: z.string(),
    date: z.string(),
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

    return {
      jobId: result.jobId,
      technicianName: result.technicianName,
      scheduledStart: result.scheduledStart,
      scheduledEnd: result.scheduledEnd,
      displayStart: selectedSlot.displayStart,
      displayEnd: selectedSlot.displayEnd,
      date: selectedSlot.date,
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
  }),
})
  .then(saveIntakeStep)
  .then(findAvailabilityStep)
  .then(awaitConfirmationStep)
  .then(bookAppointmentStep)
  .commit();
