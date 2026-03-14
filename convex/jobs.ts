import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").order("desc").collect();
    const techIds = [...new Set(jobs.map((j) => j.technicianId))];
    const techs = await Promise.all(techIds.map((id) => ctx.db.get(id)));
    const techMap = new Map(
      techs.filter(Boolean).map((t) => [t!._id, t!.name])
    );
    return jobs.map((j) => ({
      ...j,
      technicianName: techMap.get(j.technicianId) ?? "Unknown",
    }));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").order("desc").collect();
    const active = jobs.filter(
      (j) => j.status !== "completed" && j.status !== "cancelled"
    );
    const techIds = [...new Set(active.map((j) => j.technicianId))];
    const techs = await Promise.all(techIds.map((id) => ctx.db.get(id)));
    const techMap = new Map(
      techs.filter(Boolean).map((t) => [t!._id, t!.name])
    );
    return active.map((j) => ({
      ...j,
      technicianName: techMap.get(j.technicianId) ?? "Unknown",
    }));
  },
});

export const getByTechnician = query({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_technician", (q) =>
        q.eq("technicianId", args.technicianId)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
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
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("en_route"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("delayed"),
        v.literal("cancelled"),
        v.literal("bumped")
      )
    ),
    scheduledStart: v.optional(v.number()),
    scheduledEnd: v.optional(v.number()),
    eta: v.optional(v.number()),
    bumpedByJobId: v.optional(v.id("jobs")),
    notes: v.optional(v.string()),
    technicianId: v.optional(v.id("technicians")),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const filtered = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);
    }
  },
});
