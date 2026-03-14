import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scheduledServices")
      .withIndex("by_scheduledStart")
      .order("asc")
      .collect();
  },
});

export const listUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db
      .query("scheduledServices")
      .withIndex("by_scheduledStart", (q) => q.gte("scheduledStart", now))
      .order("asc")
      .collect();
    return all.filter((s) => s.status === "scheduled");
  },
});

export const listInRange = query({
  args: {
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("scheduledServices")
      .withIndex("by_scheduledStart", (q) =>
        q.gte("scheduledStart", args.rangeStart).lte("scheduledStart", args.rangeEnd),
      )
      .order("asc")
      .collect();
    return all;
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduledServices", {
      ...args,
      status: "scheduled",
      createdAt: Date.now(),
    });
  },
});

export const reschedule = mutation({
  args: {
    jobId: v.id("jobs"),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("scheduledServices")
      .withIndex("by_scheduledStart")
      .collect();
    const record = all.find(
      (s) => s.jobId === args.jobId && s.status === "scheduled",
    );
    if (!record) throw new Error("Scheduled service not found for job");

    await ctx.db.patch(record._id, {
      scheduledStart: args.scheduledStart,
      scheduledEnd: args.scheduledEnd,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("scheduledServices"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
