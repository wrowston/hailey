import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    vipStatus: v.boolean(),
    notes: v.optional(v.string()),
    equipmentSummary: v.optional(v.string()),
    maintenanceMember: v.boolean(),
  }),

  technicians: defineTable({
    name: v.string(),
    skills: v.array(v.string()),
    status: v.union(
      v.literal("available"),
      v.literal("en_route"),
      v.literal("on_job"),
      v.literal("off_duty")
    ),
    territory: v.string(),
    currentJobId: v.optional(v.id("jobs")),
    reliabilityScore: v.number(),
    phone: v.string(),
  }),

  serviceRequests: defineTable({
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerPhone: v.string(),
    customerAddress: v.string(),
    issueSummary: v.string(),
    notes: v.optional(v.string()),
    urgency: v.optional(
      v.union(
        v.literal("emergency"),
        v.literal("urgent"),
        v.literal("routine")
      )
    ),
    urgencyScore: v.optional(v.number()),
    likelyJobType: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("classified"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  }).index("by_status", ["status"]),

  jobs: defineTable({
    requestId: v.optional(v.id("serviceRequests")),
    technicianId: v.id("technicians"),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    priority: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine")
    ),
    category: v.string(),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    eta: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("en_route"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("delayed"),
      v.literal("cancelled"),
      v.literal("bumped")
    ),
    bumpedByJobId: v.optional(v.id("jobs")),
    notes: v.optional(v.string()),
  })
    .index("by_technician", ["technicianId"])
    .index("by_status", ["status"]),

  agentDecisions: defineTable({
    type: v.union(
      v.literal("classification"),
      v.literal("assignment"),
      v.literal("replan"),
      v.literal("disruption"),
      v.literal("communication"),
      v.literal("escalation")
    ),
    relatedRequestId: v.optional(v.id("serviceRequests")),
    relatedJobId: v.optional(v.id("jobs")),
    summary: v.string(),
    rationale: v.string(),
  }),

  outgoingMessages: defineTable({
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    relatedJobId: v.optional(v.id("jobs")),
    messageType: v.union(
      v.literal("eta_confirmation"),
      v.literal("delay_notice"),
      v.literal("reschedule_apology"),
      v.literal("technician_dispatched"),
      v.literal("followup_summary"),
      v.literal("cancellation")
    ),
    content: v.string(),
    channel: v.union(v.literal("sms"), v.literal("email")),
  }),

  simulationEvents: defineTable({
    type: v.string(),
    payload: v.any(),
    processed: v.boolean(),
  }),
});
