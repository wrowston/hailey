import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobs").order("desc").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("jobs").order("desc").collect();
    return all.filter(
      (j) => j.status !== "completed" && j.status !== "cancelled",
    );
  },
});

export const listByTechnician = query({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_technician", (q) =>
        q.eq("technicianId", args.technicianId),
      )
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const assignTechnician = mutation({
  args: {
    id: v.id("jobs"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      technicianId: args.technicianId,
      status: "assigned",
    });
    await ctx.db.patch(args.technicianId, {
      currentJobId: args.id,
      status: "busy",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("en_route"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("delayed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const markDelayed = mutation({
  args: {
    id: v.id("jobs"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    await ctx.db.patch(args.id, {
      status: "delayed",
      notes: args.notes ?? job.notes,
    });

    if (job.technicianId) {
      await ctx.db.patch(job.technicianId, { status: "delayed" });
    }
  },
});

export const completeJob = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    await ctx.db.patch(args.id, { status: "completed" });

    if (job.technicianId) {
      await ctx.db.patch(job.technicianId, {
        currentJobId: undefined,
        status: "available",
      });
    }
  },
});
