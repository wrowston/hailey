import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  mastraThreadsTable,
  mastraMessagesTable,
  mastraResourcesTable,
  mastraWorkflowSnapshotsTable,
  mastraScoresTable,
  mastraVectorIndexesTable,
  mastraVectorsTable,
  mastraDocumentsTable,
} from "@mastra/convex/schema";

export default defineSchema({
  // ── Mastra tables ──────────────────────────────────────────────────
  mastra_threads: mastraThreadsTable,
  mastra_messages: mastraMessagesTable,
  mastra_resources: mastraResourcesTable,
  mastra_workflow_snapshots: mastraWorkflowSnapshotsTable,
  mastra_scorers: mastraScoresTable,
  mastra_vector_indexes: mastraVectorIndexesTable,
  mastra_vectors: mastraVectorsTable,
  mastra_documents: mastraDocumentsTable,

  // ── Dispatch tables ────────────────────────────────────────────────

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.string(),
    vipStatus: v.boolean(),
    maintenanceMember: v.boolean(),
    notes: v.optional(v.string()),
    equipmentSummary: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_vipStatus", ["vipStatus"]),

  technicians: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    skills: v.array(v.string()),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("delayed"),
      v.literal("offline"),
    ),
    territory: v.string(),
    currentJobId: v.optional(v.id("jobs")),
    reliabilityScore: v.number(),
    isOnCall: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_territory", ["territory"]),

  serviceRequests: defineTable({
    customerId: v.id("customers"),
    issueSummary: v.string(),
    notes: v.optional(v.string()),
    urgency: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine"),
    ),
    urgencyScore: v.number(),
    likelyJobType: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("triaged"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_urgency", ["urgency"])
    .index("by_createdAt", ["createdAt"]),

  jobs: defineTable({
    requestId: v.id("serviceRequests"),
    technicianId: v.optional(v.id("technicians")),
    priority: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine"),
    ),
    category: v.string(),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    eta: v.optional(v.string()),
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("en_route"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("delayed"),
      v.literal("cancelled"),
    ),
    bumpedByJobId: v.optional(v.id("jobs")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_technician", ["technicianId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_scheduledStart", ["scheduledStart"]),

  agentDecisions: defineTable({
    type: v.union(
      v.literal("triage"),
      v.literal("assignment"),
      v.literal("reassignment"),
      v.literal("delay"),
      v.literal("message"),
      v.literal("simulation"),
      v.literal("resolution"),
    ),
    relatedRequestId: v.optional(v.id("serviceRequests")),
    relatedJobId: v.optional(v.id("jobs")),
    summary: v.string(),
    rationale: v.string(),
    createdAt: v.number(),
  })
    .index("by_request", ["relatedRequestId"])
    .index("by_job", ["relatedJobId"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  outgoingMessages: defineTable({
    customerId: v.id("customers"),
    relatedJobId: v.optional(v.id("jobs")),
    messageType: v.union(
      v.literal("eta_update"),
      v.literal("delay_notice"),
      v.literal("reschedule"),
      v.literal("dispatch_confirmation"),
      v.literal("follow_up"),
    ),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_job", ["relatedJobId"])
    .index("by_messageType", ["messageType"])
    .index("by_createdAt", ["createdAt"]),

  scheduledServices: defineTable({
    jobId: v.id("jobs"),
    serviceRequestId: v.id("serviceRequests"),
    customerId: v.id("customers"),
    customerName: v.string(),
    customerPhone: v.string(),
    customerAddress: v.string(),
    technicianId: v.id("technicians"),
    technicianName: v.string(),
    category: v.string(),
    priority: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine"),
    ),
    issueSummary: v.string(),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
  })
    .index("by_scheduledStart", ["scheduledStart"])
    .index("by_status", ["status"])
    .index("by_technicianId", ["technicianId"]),

  simulationEvents: defineTable({
    type: v.union(
      v.literal("new_emergency"),
      v.literal("traffic_delay"),
      v.literal("part_unavailable"),
      v.literal("customer_cancellation"),
      v.literal("vip_emergency"),
      v.literal("routine_request"),
      v.literal("overtime_risk"),
    ),
    payload: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),
});
